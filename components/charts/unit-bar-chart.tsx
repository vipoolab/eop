"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { commandsByUnit } from "@/lib/mock-data";

export function UnitBarChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={commandsByUnit}
        margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="unit"
          tick={{ fontSize: 11, fill: "#64748b" }}
          stroke="#cbd5e1"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          stroke="#cbd5e1"
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
          formatter={(value: number, _name, props) => [
            value,
            props.payload.name,
          ]}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {commandsByUnit.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
