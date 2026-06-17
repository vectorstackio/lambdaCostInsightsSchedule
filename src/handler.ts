// handler.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

  console.log('PDF uploaded to S3:', key)

  // 5. Return response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Report generated successfully',
      key
    })
  }
}
