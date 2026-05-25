"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DataPoint } from "@/lib/dashboard/mock-data";

interface Props {
  data: DataPoint[];
  height?: number;
}

export function ChartBar({ data, height = 300 }: Props) {
  const byUnitData = useMemo(() => {
    const buckets = new Map<string, { unit: string; issued: number; completed: number; late: number }>();
    for (const d of data) {
      const b = buckets.get(d.unitName) ?? { unit: d.unitName, issued: 0, completed: 0, late: 0 };
      b.issued += d.commandsIssued;
      b.completed += d.commandsCompleted;
      b.late += d.commandsLate;
      buckets.set(d.unitName, b);
    }
    return Array.from(buckets.values()).sort((a, b) => b.issued - a.issued);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={byUnitData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis dataKey="unit" type="category" tick={{ fontSize: 10 }} width={60} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "2px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        <Bar dataKey="issued" fill="#1e3a5f" name="ออกคำสั่ง" />
        <Bar dataKey="completed" fill="#10b981" name="ปฏิบัติเสร็จ" />
        <Bar dataKey="late" fill="#dc2626" name="ล่าช้า" />
      </BarChart>
    </ResponsiveContainer>
  );
}
