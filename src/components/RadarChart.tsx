import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";

interface SkillData {
  skill: string;
  score: number;
  fullMark: number;
}

interface RadarChartProps {
  data: Record<string, number>;
  width?: number;
  height?: number;
}

export function RadarChartComponent({ data, width = 250, height = 250 }: RadarChartProps) {
  const chartData: SkillData[] = Object.entries(data).map(([skill, score]) => ({
    skill: skill
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    score: typeof score === "number" ? score : 0,
    fullMark: 5,
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-muted bg-bg-tertiary rounded-xl"
        style={{ width: width, height: height }}
      >
        No skill data available
      </div>
    );
  }

  return (
    <div style={{ width: width, height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Skill Score"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="#3b82f6"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: any, name: any) => {
              const numValue = typeof value === 'number' ? value : parseFloat(String(value));
              return [isNaN(numValue) ? "0" : numValue.toFixed(2), "Score"];
            }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
