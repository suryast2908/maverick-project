import React from 'react';

interface LineChartProps {
    data: { label: string; value: number }[];
    color: string;
    title?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, color, title }) => {
    const maxValue = 100; // Scores are 0-100
    const yAxisLabels = [0, 25, 50, 75, 100];
    const width = 500;
    const height = 250;
    const padding = 50;

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 rounded-lg">
                {title && <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">{title}</h4>}
                <p>No data available.</p>
            </div>
        );
    }

    const points = data.map((point, i) => {
        const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
        const y = height - padding - (point.value / maxValue) * (height - padding * 2);
        return { x, y, ...point };
    });

    const pathD = points.length > 1 
      ? "M " + points.map(p => `${p.x} ${p.y}`).join(" L ")
      : points.length === 1 ? `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}` : "";
      
    return (
        <div className="w-full p-4 flex flex-col items-center h-80">
            {title && <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">{title}</h4>}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-Axis Labels and Grid Lines */}
                {yAxisLabels.map(label => {
                    const y = height - padding - (label / maxValue) * (height - padding * 2);
                    return (
                        <g key={label} className="text-xs text-gray-500 dark:text-gray-400">
                            <text x={padding - 12} y={y + 4} textAnchor="end">{label}</text>
                            <line x1={padding} y1={y} x2={width - padding + 10} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3"/>
                        </g>
                    );
                })}

                {/* X-Axis Labels */}
                {points.map((point, i) => (
                    <text key={i} x={point.x} y={height - padding + 20} textAnchor="middle" className="text-xs text-gray-500 dark:text-gray-400">
                        {point.label}
                    </text>
                ))}

                {/* Line Path */}
                {pathD && <path d={pathD} fill="none" stroke={color} strokeWidth="2" />}

                {/* Data Points and Tooltips */}
                {points.map((point, i) => (
                     <g key={i} className="group">
                        <circle cx={point.x} cy={point.y} r="4" fill={color} className="cursor-pointer" />
                        <circle cx={point.x} cy={point.y} r="8" fill={color} fillOpacity="0.2" className="transition-opacity opacity-0 group-hover:opacity-100" />
                        <g className="transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none">
                             <rect x={point.x - 20} y={point.y - 35} width="40" height="25" fill="#1f2937" rx="4" />
                             <text x={point.x} y={point.y - 20} textAnchor="middle" fill="white" className="text-xs font-bold">{point.value}%</text>
                        </g>
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default LineChart;
