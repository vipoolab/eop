"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { commandsPerMonth } from "@/lib/mock-data";

export function CommandLineChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={commandsPerMonth}
        margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
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
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="คำสั่งที่ออก"
          stroke="#1e40af"
          strokeWidth={2.5}
          dot={{ fill: "#1e40af", r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="completed"
          name="ดำเนินการเสร็จ"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ fill: "#10b981", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
