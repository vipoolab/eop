"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DataPoint } from "@/lib/dashboard/mock-data";
import { formatPeriod, type TimeRange } from "@/lib/dashboard/filters";

interface Props {
  data: DataPoint[];
  timeRange: TimeRange;
  height?: number;
}

export function ChartLine({ data, timeRange, height = 300 }: Props) {
  const trendData = useMemo(() => {
    const buckets = new Map<string, { period: string; issued: number; completed: number; late: number }>();
    for (const d of data) {
      let key: string;
      if (timeRange === "daily") key = d.date;
      else if (timeRange === "monthly") key = d.date.slice(0, 7);
      else key = String(d.year);
      const b = buckets.get(key) ?? { period: key, issued: 0, completed: 0, late: 0 };
      b.issued += d.commandsIssued;
      b.completed += d.commandsCompleted;
      b.late += d.commandsLate;
      buckets.set(key, b);
    }
    return Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [data, timeRange]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => formatPeriod(v, timeRange)}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "2px",
            fontSize: "12px",
          }}
          labelFormatter={(v) => formatPeriod(String(v), timeRange)}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Line type="monotone" dataKey="issued" stroke="#1e3a5f" strokeWidth={2} name="ออกคำสั่ง" dot={false} />
        <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="ปฏิบัติเสร็จ" dot={false} />
        <Line type="monotone" dataKey="late" stroke="#dc2626" strokeWidth={2} name="ล่าช้า" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
