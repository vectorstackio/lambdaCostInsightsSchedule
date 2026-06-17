// types/index.ts

import {
  type Dimension,
  // type Expression,
  // type ResultByTime,
  type Group,
} from '@aws-sdk/client-cost-explorer'

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

export type CostGroup = Group

export type TopRecommendation = {
  resourceType: string
  action: string
  current: string
  recommended: string
}

export type ServiceComparison = {
  service: string
  currentCost: number
  previousCost: number
  change: number
  changePercent: number
}

export type TrendPoint = {
  month: string
  cost: number
}

export type CostIncreaseDriver = {
  service: string
  currentCost: number
  previousCost: number
  increase: number
  contributionPercent: number
  isNewService: boolean
}

export type ServiceAnomaly = {
  service: string
  currentCost: number
  averageCost: number
  spikeAmount: number
  spikePercent: number
  zScore: number
  severity: 'low' | 'medium' | 'high'
}

export type RootCauseNode = {
  level: Dimension
  key: string

  currentCost: number
  previousCost: number
  change: number
  changePercent: number

  contributionToParent: number

  isNew?: boolean

  children?: RootCauseNode[]
}

export type SummaryResponse = {
  currentMonthCost: number
  previousMonthCost: number
  monthOverMonthChangePercent: number
  byService: { service: string; cost: number }[]  // 👈 revert this
  byServiceComparison: ServiceComparison[]        // 👈 keep enhanced version separately
  trend: TrendPoint[]
  potentialSavings: number
  recommendationCount: number
  topRecommendations: TopRecommendation[]
  topCostIncreaseDrivers: CostIncreaseDriver[]
  anomalies: ServiceAnomaly[]
  rootCauseTree: RootCauseNode[]
  topCausalChains: RootCauseNode[]
  metadata?: {
    generatedAt: string
    currency: string
  }
}

