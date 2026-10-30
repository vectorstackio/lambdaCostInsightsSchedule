import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { SendEmailCommand } from '@aws-sdk/client-ses'

const mocks = vi.hoisted(() => ({
  s3Send: vi.fn(),
  sesSend: vi.fn(),
  sign: vi.fn(),
  month: vi.fn()
}))

vi.mock('@aws-sdk/client-s3', async (importOriginal) => ({
  ...await importOriginal<typeof import('@aws-sdk/client-s3')>(),
  S3Client: class { send = mocks.s3Send }
}))
vi.mock('@aws-sdk/client-ses', async (importOriginal) => ({
  ...await importOriginal<typeof import('@aws-sdk/client-ses')>(),
  SESClient: class { send = mocks.sesSend }
}))
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: mocks.sign }))
vi.mock('../src/lib/date', () => ({ getPreviousMonthYYYYMM: mocks.month }))

import { handler } from '../src/handler'

const key = 'reports/aws-cost-2025-12.pdf'
const signedUrl = 'https://example.test/report?token=private-token'
const errorResponse = {
  statusCode: 500,
  body: JSON.stringify({ error: 'Internal server error in costInsightsScheduleLambda' })
}

describe('cost insights schedule handler', () => {
  let log: ReturnType<typeof vi.spyOn>
  let error: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BUCKET_NAME', 'test-bucket')
    mocks.month.mockReturnValue('2025-12')
    mocks.s3Send.mockResolvedValue({})
    mocks.sign.mockResolvedValue(signedUrl)
    mocks.sesSend.mockResolvedValue({ MessageId: 'message-id' })
    log = vi.spyOn(console, 'log').mockImplementation(() => {})
    error = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('checks the report, signs a seven-day URL, and emails the report', async () => {
    expect(await handler()).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: 'Report email sent successfully', key })
    })
    expect(mocks.s3Send).toHaveBeenCalledTimes(1)
    const head = mocks.s3Send.mock.calls[0][0]
    expect(head).toBeInstanceOf(HeadObjectCommand)
    expect(head.input).toEqual({ Bucket: 'test-bucket', Key: key })
    expect(mocks.sign).toHaveBeenCalledTimes(1)
    const [client, get, options] = mocks.sign.mock.calls[0]
    expect(client.send).toBe(mocks.s3Send)
    expect(get).toBeInstanceOf(GetObjectCommand)
    expect(get.input).toEqual({ Bucket: 'test-bucket', Key: key })
    expect(options).toEqual({ expiresIn: 604800 })
    const email = mocks.sesSend.mock.calls[0][0]
    expect(email).toBeInstanceOf(SendEmailCommand)
    expect(email.input.Source).toBe('reports@thebrilliantclub.org')
    expect(email.input.Destination.ToAddresses).toEqual([
      'mike.garthwaite@thebrilliantclub.org', 'apoorwa.saxena@thebrilliantclub.org',
      'sophie.callin@thebrilliantclub.org', 'leanne@thebrilliantclub.org'
    ])
    expect(email.input.Message.Subject.Data).toBe('AWS Cost Report - 2025-12')
    expect(email.input.Message.Body.Text.Data).toContain(signedUrl)
    expect(log).toHaveBeenCalledWith(`Email sent for report: ${key}`)
    expect(error).not.toHaveBeenCalled()
    expect(JSON.stringify(log.mock.calls)).not.toContain(signedUrl)
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-token')
  })

  it('returns a generic error and stops when the report lookup fails', async () => {
    mocks.s3Send.mockRejectedValue(new Error('not found'))
    expect(await handler()).toEqual(errorResponse)
    expect(mocks.sign).not.toHaveBeenCalled()
    expect(mocks.sesSend).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(2)
    expect(log).not.toHaveBeenCalled()
  })

  it('returns a generic error and does not email if signing fails', async () => {
    mocks.sign.mockRejectedValue(new Error('signing failed'))
    expect(await handler()).toEqual(errorResponse)
    expect(mocks.sesSend).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
    expect(log).not.toHaveBeenCalled()
  })

  it('returns a generic error when email delivery fails', async () => {
    mocks.sesSend.mockRejectedValue(new Error('email failed'))
    expect(await handler()).toEqual(errorResponse)
    expect(mocks.sesSend).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledTimes(1)
    expect(log).not.toHaveBeenCalled()
  })

  it('handles errors from the date helper', async () => {
    mocks.month.mockImplementation(() => { throw new Error('date failed') })
    expect(await handler()).toEqual(errorResponse)
    expect(mocks.s3Send).not.toHaveBeenCalled()
    expect(mocks.sign).not.toHaveBeenCalled()
    expect(mocks.sesSend).not.toHaveBeenCalled()
  })

  it('handles an unset bucket when S3 rejects the invalid request', async () => {
    delete process.env.BUCKET_NAME
    mocks.s3Send.mockRejectedValue(new Error('Bucket is required'))
    expect(await handler()).toEqual(errorResponse)
    expect(mocks.s3Send.mock.calls[0][0].input.Bucket).toBeUndefined()
    expect(mocks.sign).not.toHaveBeenCalled()
    expect(mocks.sesSend).not.toHaveBeenCalled()
  })

  it('handles non-Error rejections without exposing them in the response', async () => {
    mocks.sesSend.mockRejectedValue('private rejection')
    expect(await handler()).toEqual(errorResponse)
  })

  it.each([
    ['report lookup', mocks.s3Send, [['Report lookup failed'], ['Error in costInsightsScheduleLambda']]],
    ['URL signing', mocks.sign, [['Error in costInsightsScheduleLambda']]],
    ['email delivery', mocks.sesSend, [['Error in costInsightsScheduleLambda']]]
  ])('does not log sensitive details from a %s error', async (_operation, send, expectedLogs) => {
    const sensitiveError = Object.assign(new Error('private-token'), { secret: 'private-secret' })
    send.mockRejectedValue(sensitiveError)
    expect(await handler()).toEqual(errorResponse)
    expect(error.mock.calls).toEqual(expectedLogs)
    expect(log).not.toHaveBeenCalled()
  })
})
