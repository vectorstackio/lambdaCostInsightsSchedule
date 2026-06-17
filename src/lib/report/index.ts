// lib/report/index.ts

import type { CostReport, SummaryResponse } from '../../types'

export function toCostReport(
  summary: SummaryResponse,
  month: string
): CostReport {
  const currentCost = summary.currentMonthCost
  const previousCost = summary.previousMonthCost

  return {
    period: {
      month,
      generatedAt:
        summary.metadata?.generatedAt ?? new Date().toISOString()
    },

    metrics: {
      currentCost,
      previousCost,
      monthOverMonthChangePercent:
        summary.monthOverMonthChangePercent
    },

    narratives: {
      executiveSummary: buildExecutiveSummary(
        month,
        currentCost,
        summary.monthOverMonthChangePercent,
        summary.topCostIncreaseDrivers?.[0]
      )
    },

    findings: buildFindings(summary),

    drivers: summary.topCostIncreaseDrivers.map(d => ({
      service: d.service,
      increase: d.increase
    })),

    anomalies: summary.anomalies.map(a => ({
      service: a.service,
      spikeAmount: a.spikeAmount,
      spikePercent: a.spikePercent
    })),

    savings: {
      totalPotential: summary.potentialSavings,
      recommendationCount: summary.recommendationCount
    }
  }
}

function buildFindings(summary: SummaryResponse) {
  const findings: { title: string; description: string }[] = []

  const top = summary.topCostIncreaseDrivers[0]

  if (top) {
    findings.push({
      title: `Top cost driver: ${top.service}`,
      description: `Increase of £${top.increase.toFixed(2)} this month.`
    })
  }

  const highAnomalies = summary.anomalies.filter(
    a => a.severity === 'high'
  )

  if (highAnomalies.length > 0) {
    findings.push({
      title: 'High severity anomalies detected',
      description: `${highAnomalies.length} services show unusual cost spikes.`
    })
  }

  findings.push({
    title: 'Monthly trend',
    description: `Overall change: ${summary.monthOverMonthChangePercent}%`
  })

  return findings
}

function buildExecutiveSummary(
  month: string,
  currentCost: number,
  changePercent: number,
  topDriver?: { service: string; increase: number }
): string {
  return `
AWS cost report for ${month} shows total spend of £${currentCost.toFixed(2)}, 
representing a ${changePercent}% change month-over-month.

${topDriver
    ? `Primary driver: ${topDriver.service} increased by £${topDriver.increase.toFixed(2)}.`
    : ''}
`.trim()
}