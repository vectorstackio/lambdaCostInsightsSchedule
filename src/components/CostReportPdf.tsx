// CostReportPdf.tsx

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link
} from '@react-pdf/renderer'

import type { CostReport } from "./../types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#111827' // gray-900
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
    marginBottom: 24
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6
  },

  subText: {
    fontSize: 9,
    color: '#6B7280'
  },

  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain'
  },

  section: {
    marginBottom: 24
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8
  },

  grid3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },

  metricCard: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    borderRadius: 4
  },

  metricLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4
  },

  metricValue: {
    fontSize: 14,
    fontWeight: 700
  },

  highlight: {
    color: '#2563EB'
  },

  listItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    marginBottom: 6,
    borderRadius: 4
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6
  },

  anomalyBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6
  },

  greenText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: 700
  }
})

type Props = {
  report: CostReport
  //month: string
}


export const CostReportPdf = ({ report/*, month */ }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* -----------------------
          HEADER
      ----------------------- */}
      <View style={styles.header}>

        {/* LEFT */}
        <View>
          <Text style={styles.title}>
            The Brilliant Club AWS Cost Report
          </Text>

          <Text style={styles.subText}>
            Period: {report.period.month} · Generated:{' '}
            {new Date(report.period.generatedAt).toLocaleString()}
          </Text>
        </View>

        {/* RIGHT */}
        <Image
          src="https://your-s3-bucket/images/HubTBCLogo.png"
          style={styles.logo}
        />
      </View>

      {/* -----------------------
          KEY METRICS
      ----------------------- */}
      <View style={styles.grid3}>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Cost</Text>
          <Text style={styles.metricValue}>
            £{report.metrics.currentCost.toFixed(2)}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Previous Cost</Text>
          <Text style={styles.metricValue}>
            £{report.metrics.previousCost.toFixed(2)}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, styles.highlight]}>
            {report.metrics.monthOverMonthChangePercent}%
          </Text>
          <Text style={styles.metricLabel}>MoM Change</Text>
        </View>

      </View>

      {/* -----------------------
          EXECUTIVE SUMMARY
      ----------------------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Executive Summary
        </Text>

        <Text>
          {report.narratives.executiveSummary}
        </Text>
      </View>

      {/* -----------------------
          KEY FINDINGS
      ----------------------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Key Findings
        </Text>

        {report.findings.map((f, i: number) => (
          <View key={i} style={styles.listItem}>
            <Text style={{ fontWeight: 700 }}>
              {f.title}
            </Text>
            <Text>
              {f.description}
            </Text>
          </View>
        ))}
      </View>

      {/* -----------------------
          COST DRIVERS
      ----------------------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Cost Drivers
        </Text>

        {report.drivers.map((d) => (
          <View key={d.service} style={styles.row}>
            <Text>{d.service}</Text>
            <Text>£{d.increase.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* -----------------------
          ANOMALIES
      ----------------------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Anomalies
        </Text>

        {report.anomalies.length === 0 ? (
          <Text>No anomalies detected</Text>
        ) : (
          report.anomalies.map((a) => (
            <View key={a.service} style={styles.anomalyBox}>
              <Text style={{ fontWeight: 700 }}>
                {a.service}
              </Text>

              <Text>
                Spike: £{a.spikeAmount.toFixed(2)} (
                {a.spikePercent}%)
              </Text>
            </View>
          ))
        )}
      </View>

      {/* -----------------------
          SAVINGS
      ----------------------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Savings Opportunities
        </Text>

        <Text style={styles.greenText}>
          £{report.savings.totalPotential.toFixed(2)}
        </Text>

        <Text>
          {report.savings.recommendationCount} recommendations
        </Text>
      </View>

      <View>
        <Text>
          View more cost information{' '}
          <Link src="https://aws.develop.thebrilliantclub.org/dashboard">
            here
          </Link>
        </Text>
      </View>

    </Page>
  </Document>
)