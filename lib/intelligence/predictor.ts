// Mock predictive analytics helpers

import type { PredictiveTrend } from "./types";
import { listTrends as storeListTrends, getTrend as storeGetTrend } from "./store";

export function listTrends(): PredictiveTrend[] {
  return storeListTrends();
}

export function getTrend(id: string): PredictiveTrend | null {
  return storeGetTrend(id);
}

/** Format combined historical+predicted series for a single chart */
export interface ChartPoint {
  period: string;
  historical?: number;
  predicted?: number;
  /** Confidence band low/high — only on predicted points */
  predictedLow?: number;
  predictedHigh?: number;
}

export function formatChartData(trend: PredictiveTrend): ChartPoint[] {
  const points: ChartPoint[] = [];

  for (const h of trend.historical) {
    points.push({ period: h.period, historical: h.value });
  }
  // Connect last historical with first predicted by repeating the value
  const lastHist = trend.historical[trend.historical.length - 1];
  if (lastHist && trend.predicted.length > 0) {
    points[points.length - 1] = {
      ...points[points.length - 1],
      predicted: lastHist.value,
    };
  }
  for (const p of trend.predicted) {
    const range = p.value * (1 - p.confidence) * 0.5;
    points.push({
      period: p.period,
      predicted: p.value,
      predictedLow: Math.round(p.value - range),
      predictedHigh: Math.round(p.value + range),
    });
  }

  return points;
}

export function averageConfidence(trend: PredictiveTrend): number {
  if (trend.predicted.length === 0) return 0;
  const sum = trend.predicted.reduce((acc, p) => acc + p.confidence, 0);
  return sum / trend.predicted.length;
}

export function trendMaxValue(trend: PredictiveTrend): number {
  const histMax = Math.max(...trend.historical.map((h) => h.value));
  const predMax = Math.max(...trend.predicted.map((p) => p.value));
  return Math.max(histMax, predMax);
}
