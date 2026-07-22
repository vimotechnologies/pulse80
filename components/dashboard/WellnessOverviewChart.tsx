"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brand } from "@/lib/constants/brand";
import type { WellnessChartPoint } from "@/types/dashboard";

type WellnessOverviewChartProps = {
  data: WellnessChartPoint[];
};

export function WellnessOverviewChart({ data }: WellnessOverviewChartProps) {
  return (
    <div className="h-80 px-2 pb-5 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="screenings" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="5%"
                stopColor={brand.colors.primaryBlue}
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor={brand.colors.primaryBlue}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={brand.colors.divider} vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: brand.colors.mutedText, fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: brand.colors.mutedText, fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              border: `1px solid ${brand.colors.divider}`,
              borderRadius: 8,
              boxShadow: `0 16px 40px ${brand.colors.elevatedShadow}`,
            }}
          />
          <Area
            type="monotone"
            dataKey="screenings"
            name="Screenings"
            stroke={brand.colors.primaryBlue}
            strokeWidth={3}
            fill="url(#screenings)"
          />
          <Area
            type="monotone"
            dataKey="engagement"
            name="Engagement"
            stroke={brand.colors.successGreen}
            strokeWidth={2}
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="risks"
            name="Risk flags"
            stroke={brand.colors.pulseRed}
            strokeWidth={2}
            fill="transparent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
