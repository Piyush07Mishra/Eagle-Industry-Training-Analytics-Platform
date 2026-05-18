import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      {children}
    </Card>
  );
};

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface LineChartComponentProps {
  data: DataPoint[];
  dataKey: string;
  stroke?: string;
  height?: number;
  title?: string;
  description?: string;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  dataKey,
  stroke = "#3b82f6",
  height = 300,
  title,
  description,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={stroke}
          dot={{ fill: stroke, r: 5 }}
          activeDot={{ r: 7 }}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <ChartWrapper title={title} description={description}>
        {chart}
      </ChartWrapper>
    );
  }

  return chart;
};

interface BarChartComponentProps {
  data: DataPoint[];
  dataKey: string;
  fill?: string;
  height?: number;
  title?: string;
  description?: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  dataKey,
  fill = "#8b5cf6",
  height = 300,
  title,
  description,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
          }}
        />
        <Legend />
        <Bar dataKey={dataKey} fill={fill} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <ChartWrapper title={title} description={description}>
        {chart}
      </ChartWrapper>
    );
  }

  return chart;
};

export const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#6366f1",
  "#f97316",
];

interface PieChartComponentProps {
  data: { name: string; value: number }[];
  height?: number;
  title?: string;
  description?: string;
}

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  height = 300,
  title,
  description,
}) => {
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  if (title) {
    return (
      <ChartWrapper title={title} description={description}>
        {chart}
      </ChartWrapper>
    );
  }

  return chart;
};
