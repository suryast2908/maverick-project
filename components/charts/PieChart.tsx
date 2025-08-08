import React, { useState } from 'react';

interface PieChartProps {
    data: { name: string; value: number; color: string }[];
    title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
    const [hovered, setHovered] = useState<string | null>(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 rounded-lg">
                {title && <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">{title}</h4>}
                <p>No data available.</p>
            </div>
        );
    }
    let cumulative = 0;

    const sortedData = [...data].sort((a,b) => b.value - a.value);

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
         <div className="flex flex-col items-center gap-6 h-full">
            {title && <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">{title}</h4>}
            <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                <div className="relative w-48 h-48">
                    <svg viewBox="-1 -1 2 2" className="transform -rotate-90">
                        {sortedData.map(item => {
                            const percent = item.value / total;
                            const [startX, startY] = getCoordinatesForPercent(cumulative);
                            cumulative += percent;
                            const [endX, endY] = getCoordinatesForPercent(cumulative);
                            const largeArcFlag = percent > 0.5 ? 1 : 0;

                            const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;

                            return (
                                <path
                                    key={item.name}
                                    d={pathData}
                                    fill={item.color}
                                    onMouseEnter={() => setHovered(item.name)}
                                    onMouseLeave={() => setHovered(null)}
                                    className="transition-transform duration-200 ease-in-out cursor-pointer"
                                    style={{ transform: hovered === item.name ? 'scale(1.05)' : 'scale(1)'}}
                                />
                            );
                        })}
                    </svg>
                    {hovered && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{sortedData.find(d => d.name === hovered)?.value}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">{hovered}</div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="w-full md:w-auto">
                    <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Legend</h4>
                    <ul className="space-y-1 text-sm">
                        {sortedData.map(item => (
                            <li key={item.name} className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                                <span className="ml-auto text-gray-500 dark:text-gray-400 font-mono">({((item.value / total) * 100).toFixed(0)}%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PieChart;
