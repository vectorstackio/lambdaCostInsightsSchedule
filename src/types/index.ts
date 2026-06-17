// types/index.ts

export type CostReport = {
  period: {
    month: string
    generatedAt: string
  }

  metrics: {
    currentCost: number
    previousCost: number
    monthOverMonthChangePercent: number
  }

  narratives: {
    executiveSummary: string
  }

  findings: {
    title: string
    description: string
  }[]

  drivers: {
    service: string
    increase: number
  }[]

  anomalies: {
    service: string
    spikeAmount: number
    spikePercent: number
  }[]

  savings: {
    totalPotential: number
    recommendationCount: number
  }
}

