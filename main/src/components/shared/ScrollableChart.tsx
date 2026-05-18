import { useRef } from "react";

interface ScrollableChartProps {
  itemCount: number;
  itemWidth?: number;
  minWidth?: number;
  height?: number;
  title: string;
  children: (width: number) => React.ReactNode;
}

export default function ScrollableChart({
  itemCount,
  itemWidth = 80,
  minWidth = 400,
  height = 300,
  title,
  children,
}: ScrollableChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWidth = Math.max(itemCount * itemWidth, minWidth);

  return (
    <div className="w-full">
      {title ? (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      ) : null}
      <div ref={containerRef} className="overflow-x-auto scrollable-chart">
        <div className="min-w-full min-h-[340px]">
          {children(chartWidth)}
        </div>
      </div>
      {itemCount > 5 ? (
        <p className="text-xs text-gray-400 text-right mt-1">← scroll to see all →</p>
      ) : null}
    </div>
  );
}
