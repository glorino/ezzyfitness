"use client";

import { naira } from "@/lib/format";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  formatValue?: (val: number) => string;
}

export function BarChart({ data, height = 200, formatValue }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
        {data.map((item, i) => {
          const percentage = Math.max(2, (item.value / maxValue) * 100);
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-2">
              {/* Value label on hover */}
              <div className="w-full text-center">
                <span className="inline-block rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-smoke-200 opacity-0 transition-opacity group-hover:opacity-100">
                  {formatValue ? formatValue(item.value) : naira(item.value)}
                </span>
              </div>
              
              {/* Bar container */}
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                  style={{
                    height: `${percentage}%`,
                    background: item.value > 0
                      ? "linear-gradient(to top, rgba(214, 255, 63, 0.3), rgba(214, 255, 63, 0.9))"
                      : "linear-gradient(to top, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))",
                  }}
                />
              </div>
              
              {/* Label */}
              <span className="w-full truncate text-center text-[10px] font-bold uppercase tracking-wider text-smoke-500">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Legend / total */}
      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
          <span className="text-xs text-smoke-500">
            {data.filter((d) => d.value > 0).length} of {data.length} periods with revenue
          </span>
          <span className="text-sm font-semibold text-smoke-300">
            Total: {formatValue ? formatValue(data.reduce((a, b) => a + b.value, 0)) : naira(data.reduce((a, b) => a + b.value, 0))}
          </span>
        </div>
      )}
    </div>
  );
}
