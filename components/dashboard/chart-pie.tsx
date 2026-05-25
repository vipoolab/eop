"use client";

import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  COMMAND_TYPE_COLORS,
  type CommandType,
  type DataPoint,
} from "@/lib/dashboard/mock-data";

interface Props {
  data: DataPoint[];
  height?: number;
}

export function ChartPie({ data, height = 300 }: Props) {
  const byTypeData = useMemo(() => {
    const buckets = new Map<CommandType, number>();
    for (const d of data) {
      buckets.set(d.commandType, (buckets.get(d.commandType) ?? 0) + d.commandsIssued);
    }
    return Array.from(buckets.entries())
      .map(([type, value]) => ({ name: type, value, color: COMMAND_TYPE_COLORS[type] }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={byTypeData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={(entry: { name?: string; percent?: number }) =>
            `${entry.name} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={{ stroke: "#94a3b8", strokeWidth: 0.5 }}
          style={{ fontSize: "11px" }}
        >
          {byTypeData.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => `${Number(v).toLocaleString()} คำสั่ง`}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "2px",
            fontSize: "12px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
