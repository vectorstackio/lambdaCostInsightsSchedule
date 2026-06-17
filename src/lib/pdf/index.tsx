// lib/pdf/index.ts

import React from 'react'

import { renderToBuffer } from '@react-pdf/renderer'
import { CostReportPdf } from './../../components/CostReportPdf'
import { CostReport } from './../../types'

export async function generatePdf(report: CostReport) {
  return await renderToBuffer(
    <CostReportPdf report={ report } />
  )
}