import React from 'react';

interface BarChartProps {
    data: { label: string; value: number }[];
    color: string;
    title?: string;
    yAxisLabels?: string[]; // Make Y-axis labels optional and configurable
}

const BarChart: React.FC<BarChartProps> = ({ data, color, title, yAxisLabels }) => {
    const maxValue = yAxisLabels ? yAxisLabels.length - 1 : Math.max(...data.map(d => d.value), 1);
    
    const getYAxisLabels = () => {
        if (yAxisLabels) return yAxisLabels;
        const labels = [];
        for (let i = 0; i <= 4; i++) {
            labels.push(String(Math.round((i / 4) * maxValue)));
        }
        return labels;
    };
    
    const displayYAxisLabels = getYAxisLabels();

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 rounded-lg">
                <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">{title}</h4>
                <p>No data available.</p>
            </div>
        );
    }
    
    return (
        <div className="w-full h-80 flex flex-col">
            {title && <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200 text-center">{title}</h4>}
            <div className="flex-grow flex gap-4">
                {/* Y-Axis */}
                <div className="flex flex-col justify-between h-full text-xs text-gray-500 dark:text-gray-400 relative">
                    {displayYAxisLabels.slice().reverse().map(label => <span key={label}>{label}</span>)}
                </div>
                {/* Chart Area */}
                <div className="flex-grow grid grid-cols-12 gap-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                    {data.slice(-12).map((item, index) => (
                        <div key={index} className="flex flex-col items-center justify-end group relative h-full">
                             <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 text-center z-10">
                                {item.label}: {yAxisLabels ? yAxisLabels[item.value] : item.value}
                            </div>
                            <div
                                className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                                style={{ height: `${(item.value / maxValue) * 100}%`, backgroundColor: color }}
                            />
                            <span className="text-[10px] text-gray-500 mt-2 transform -rotate-45 whitespace-nowrap">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BarChart;
