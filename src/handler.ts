// handler.ts

import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getPreviousMonthYYYYMM } from './lib/date'

const s3 = new S3Client({})
const ses = new SESClient({})

export const handler = async () => {
  try {
    const month = getPreviousMonthYYYYMM()
    const bucket = process.env.BUCKET_NAME!
    const key = `reports/aws-cost-${month}.pdf`

    /**
     * Confirm report exists
     */
    try {
      await s3.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key
        })
      )
    } catch {
      console.error('Report lookup failed')
      throw new Error(`Monthly report PDF missing: ${key}`)
    }

    /**
     * Create temporary download URL
     */
    const command =
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })


    const url =
      await getSignedUrl(
        s3,
        command,
        {
          expiresIn: 60 * 60 * 24 * 7
        }
      )


    /**
     * Send email
     */
    await ses.send(
      new SendEmailCommand({
        Source: 'reports@thebrilliantclub.org',
        Destination: {
          ToAddresses: [
            'mike.garthwaite@thebrilliantclub.org',
            'apoorwa.saxena@thebrilliantclub.org',
            'sophie.callin@thebrilliantclub.org',
            'leanne@thebrilliantclub.org'
          ]
        },
        Message: {
          Subject: { Data: `AWS Cost Report - ${month}` },
          Body: {
            Text: {

              Data:
                `Your monthly AWS Cost Report is ready:

${url}

View more cost information:
https://aws.develop.thebrilliantclub.org/dashboard

View and download this and historic reports:
https://aws.develop.thebrilliantclub.org/reports

`
            }
          }
        }
      })
    )

    console.log(`Email sent for report: ${key}`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          'Report email sent successfully',
        key
      })
    }
  } catch {
    console.error('Error in costInsightsScheduleLambda')

    return {
      statusCode: 500,
      body: JSON.stringify({error: 'Internal server error in costInsightsScheduleLambda'})
    }
  }
}
