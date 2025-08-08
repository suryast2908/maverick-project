import React, { useMemo } from 'react';
import Card from './Card';
import { UserActivity } from '../types';
import ChartBarIcon from './icons/ChartBarIcon';

interface DailyProgressPanelProps {
    activity: UserActivity[];
}

const DayIndicator: React.FC<{ day: string, isActive: boolean }> = ({ day, isActive }) => (
    <div className="flex flex-col items-center space-y-2 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isActive 
            ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/30' 
            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
        }`}>
            {isActive && <span className="text-xl font-bold text-white">✓</span>}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white">{day}</span>
    </div>
);

const DailyProgressPanel: React.FC<DailyProgressPanelProps> = ({ activity }) => {
    
    const weeklyActivity = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activityByDate: Record<string, boolean> = {};
        
        for (const act of activity) {
            const date = new Date(act.date).toISOString().split('T')[0];
            activityByDate[date] = true;
        }

        const today = new Date();
        const weeklyData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            weeklyData.push({
                day: days[date.getDay()],
                isActive: !!activityByDate[dateString]
            });
        }
        return weeklyData;
    }, [activity]);

    const streak = useMemo(() => {
        let currentStreak = 0;
        const reversedActivity = [...weeklyActivity].reverse();

        for(const day of reversedActivity) {
            if(day.isActive) {
                currentStreak++;
            } else {
                break;
            }
        }
        return currentStreak;
    }, [weeklyActivity]);

    return (
        <Card title="Daily Progress" icon={<ChartBarIcon />}>
            <div className="space-y-4">
                <div className="flex justify-around items-center bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                    {weeklyActivity.map((dayData, index) => (
                        <DayIndicator key={index} day={dayData.day} isActive={dayData.isActive} />
                    ))}
                </div>
                 <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{streak > 0 ? `${streak}-Day Streak!` : "Start your streak today!"}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{streak > 1 ? `Keep up the great work!` : `Complete an activity to get started.`}</p>
                </div>
            </div>
        </Card>
    );
};

export default DailyProgressPanel;