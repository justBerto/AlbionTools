import React, { useState, useMemo } from "react";
import { Clock } from "lucide-react";
import { SessionStats, SessionHistoryPoint } from "../../types";

interface HistoryChartProps {
  stats: SessionStats;
  history: SessionHistoryPoint[];
}

interface MetricConfig {
  key: keyof Omit<SessionHistoryPoint, "timestamp" | "timeSeconds">;
  label: string;
  color: string;
  bgActive: string;
  borderActive: string;
}

const METRICS: MetricConfig[] = [
  { key: "fame", label: "Fame", color: "#f59e0b", bgActive: "bg-amber-500/15 text-amber-300", borderActive: "border-amber-500/50" },
  { key: "silver", label: "Silver", color: "#eab308", bgActive: "bg-yellow-500/15 text-yellow-300", borderActive: "border-yellow-500/50" },
  { key: "respec", label: "ReSpec", color: "#0ea5e9", bgActive: "bg-sky-500/15 text-sky-300", borderActive: "border-sky-500/50" },
  { key: "factionStanding", label: "Faction Standing", color: "#f43f5e", bgActive: "bg-rose-500/15 text-rose-300", borderActive: "border-rose-500/50" },
  { key: "factionPoints", label: "Faction Points", color: "#14b8a6", bgActive: "bg-teal-500/15 text-teal-300", borderActive: "border-teal-500/50" },
  { key: "might", label: "Might", color: "#a855f7", bgActive: "bg-purple-500/15 text-purple-300", borderActive: "border-purple-500/50" },
  { key: "favor", label: "Favor", color: "#06b6d4", bgActive: "bg-cyan-500/15 text-cyan-300", borderActive: "border-cyan-500/50" },
];

export const HistoryChart: React.FC<HistoryChartProps> = ({ stats, history }) => {
  const [activeMetrics, setActiveMetrics] = useState<Record<string, boolean>>({
    fame: true,
    silver: true,
    respec: true,
    factionStanding: true,
    factionPoints: true,
    might: true,
    favor: true,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  // Build chart points: if history has entries use them; otherwise create initial baseline progression
  const chartData = useMemo(() => {
    if (history.length >= 2) {
      return history;
    }

    // Baseline points when session has just started or before multiple intervals
    const now = new Date();
    const points: SessionHistoryPoint[] = [];
    const count = 7;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60000);
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const factor = count > 1 ? (count - 1 - i) / (count - 1) : 1;
      points.push({
        timestamp: timeStr,
        timeSeconds: Math.round(stats.uptimeSeconds * factor),
        fame: Math.round(stats.totalFame * factor),
        silver: Math.round(stats.totalSilver * factor),
        respec: Math.round(stats.reSpecPoints * factor),
        factionStanding: 0,
        factionPoints: 0,
        might: Math.round(stats.might * factor),
        favor: Math.round(stats.favor * factor),
      });
    }
    return points;
  }, [history, stats]);

  // SVG Chart Dimensions
  const width = 800;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for each metric
  const lines = useMemo(() => {
    return METRICS.map((metric) => {
      if (!activeMetrics[metric.key]) return null;

      const values = chartData.map((pt) => Number(pt[metric.key]) || 0);
      const maxVal = Math.max(...values, 1);
      const minVal = 0;
      const range = maxVal - minVal || 1;

      const coords = chartData.map((pt, idx) => {
        const x = paddingLeft + (idx / Math.max(chartData.length - 1, 1)) * plotWidth;
        const val = Number(pt[metric.key]) || 0;
        const normalized = (val - minVal) / range;
        const y = paddingTop + plotHeight - normalized * plotHeight;
        return { x, y, val, timestamp: pt.timestamp };
      });

      const pathData = coords.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, "");

      return {
        ...metric,
        maxVal,
        coords,
        pathData,
      };
    }).filter(Boolean);
  }, [chartData, activeMetrics, plotWidth, plotHeight, paddingLeft, paddingTop]);

  const activeHoverPoint = hoverIndex !== null && chartData[hoverIndex] ? chartData[hoverIndex] : null;

  return (
    <div className="space-y-4">
      {/* Toggles row matching the upstream UI */}
      <div className="flex items-center gap-2 flex-wrap">
        {METRICS.map((metric) => {
          const isActive = activeMetrics[metric.key];
          return (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              role="checkbox"
              aria-checked={isActive}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? `${metric.bgActive} ${metric.borderActive}`
                  : "bg-slate-900/60 text-slate-500 border-slate-800 hover:border-slate-700"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold border transition-colors"
                style={{
                  borderColor: isActive ? metric.color : "#475569",
                  backgroundColor: isActive ? metric.color : "transparent",
                  color: isActive ? "#080B11" : "transparent",
                }}
              >
                {isActive ? "✓" : ""}
              </span>
              <span style={{ color: isActive ? metric.color : undefined }}>{metric.label}</span>
            </button>
          );
        })}
      </div>

      {/* Vector Line Chart Canvas */}
      <div className="relative bg-[#070A11] border border-slate-800/90 rounded-2xl p-3 overflow-hidden shadow-inner">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + plotHeight * (1 - ratio);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray={ratio === 0 ? undefined : "3 3"}
                  strokeOpacity={0.7}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {ratio === 0 ? "0" : ratio === 1 ? "Max" : `${Math.round(ratio * 100)}%`}
                </text>
              </g>
            );
          })}

          {/* Time Labels on X-axis */}
          {chartData.map((pt, idx) => {
            const x = paddingLeft + (idx / Math.max(chartData.length - 1, 1)) * plotWidth;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={paddingTop + plotHeight}
                  x2={x}
                  y2={paddingTop + plotHeight + 5}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {pt.timestamp}
                </text>
              </g>
            );
          })}

          {/* Metric Trend Lines */}
          {lines.map((line: any) => (
            <g key={line.key}>
              <path
                d={line.pathData}
                fill="none"
                stroke={line.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
              {/* Vertex Dots */}
              {line.coords.map((pt: any, i: number) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIndex === i ? 4.5 : 2.5}
                  fill={line.color}
                  stroke="#070A11"
                  strokeWidth="1.5"
                  className="transition-all duration-150"
                />
              ))}
            </g>
          ))}

          {/* Vertical Crosshair on Hover */}
          {hoverIndex !== null && (
            <line
              x1={paddingLeft + (hoverIndex / Math.max(chartData.length - 1, 1)) * plotWidth}
              y1={paddingTop}
              x2={paddingLeft + (hoverIndex / Math.max(chartData.length - 1, 1)) * plotWidth}
              y2={paddingTop + plotHeight}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          )}

          {/* Invisible Overlay Rectangles for Smooth Hover Interaction */}
          {chartData.map((_, idx) => {
            const sliceWidth = plotWidth / Math.max(chartData.length - 1, 1);
            const x = paddingLeft + idx * sliceWidth - sliceWidth / 2;
            return (
              <rect
                key={idx}
                x={Math.max(paddingLeft, x)}
                y={paddingTop}
                width={sliceWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeHoverPoint && hoverIndex !== null && (
          <div
            className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs font-mono z-20 pointer-events-none space-y-1.5 min-w-[180px]"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Time</span>
              </span>
              <span className="font-bold text-slate-200">{activeHoverPoint.timestamp}</span>
            </div>
            <div className="space-y-1 pt-0.5">
              {METRICS.filter((m) => activeMetrics[m.key]).map((m) => {
                const val = Number(activeHoverPoint[m.key]) || 0;
                return (
                  <div key={m.key} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="text-[11px] font-sans">{m.label}:</span>
                    </span>
                    <span className="font-bold" style={{ color: m.color }}>
                      {formatNumber(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
