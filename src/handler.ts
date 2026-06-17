// handler.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { handleSummary } from './lib/summary'
import { generatePdf } from './lib/pdf'
import { getPreviousMonthYYYYMM } from './lib/date'
import { toCostReport } from './lib/report'
//import type { CostReport } from './types'

const s3 = new S3Client({})

export const handler = async () => {
  // const month = '2026-06'
  const month = getPreviousMonthYYYYMM()

  // 1. Build report data
  const summary = await handleSummary(month)

  console.log(summary)

  const report = toCostReport(summary, month)

  // 2. Convert summary → PDF
  const pdfBuffer = await generatePdf(report)

  // 3. Define S3 key
  const key = `reports/${month}-scheduled.pdf`

  // 4. Upload to S3
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    })
  )

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `reports/${month}-scheduled.json`,
      Body: JSON.stringify(summary),
      ContentType: 'application/json'
    })
  )

  console.log('PDF and JSON uploaded to S3:', key)

  const ses = new SESClient({})

  const command = new GetObjectCommand({
    Bucket: 'tbccostreports',
    Key: `reports/${month}-scheduled.pdf`
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 60 * 24 * 7 })

  await ses.send(
    new SendEmailCommand({
      Source: 'reports@thebrilliantclub.org',
      Destination: {
        ToAddresses: ['mike.garthwaite@thebrilliantclub.org', 'apoorwa.saxena@thebrilliantclub.org']
      },
      Message: {
        Subject: {
          Data: `AWS Cost Report - ${month}`
        },
        Body: {
          Text: {
            Data: `Your report is ready:\n\n${url}\n\n\nView more cost information https://aws.develop.thebrilliantclub.org/dashboard.`
          }
        }
      }
    })
  )

  console.log('Email sent to: mike.garthwaite@thebrilliantclub.org')

  // 5. Return response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Report generated successfully',
      key
    })
  }
}
