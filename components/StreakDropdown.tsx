
import React, { useMemo } from 'react';
import { UserActivity } from '../types';
import FireIcon from './icons/FireIcon';

interface StreakDropdownProps {
    activity: UserActivity[];
    onClose: () => void;
}

const toDateString = (date: Date) => date.toISOString().split('T')[0];

const StreakDropdown: React.FC<StreakDropdownProps> = ({ activity }) => {
    const { currentStreak, longestStreak, activityMap } = useMemo(() => {
        if (!activity || activity.length === 0) {
            return { currentStreak: 0, longestStreak: 0, activityMap: new Map() };
        }

        const activityDates = new Set(activity.map(act => toDateString(new Date(act.date))));

        // Calculate current streak
        let currentStreak = 0;
        let checkDate = new Date();
        if (activityDates.has(toDateString(checkDate))) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            while (activityDates.has(toDateString(checkDate))) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        // Calculate longest streak
        const sortedDates = Array.from(activityDates).sort();
        let longestStreak = 0;
        if (sortedDates.length > 0) {
            longestStreak = 1;
            let currentRun = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i]);
                const prevDate = new Date(sortedDates[i-1]);
                const diffTime = currentDate.getTime() - prevDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

                if (diffDays === 1) {
                    currentRun++;
                } else {
                    longestStreak = Math.max(longestStreak, currentRun);
                    currentRun = 1;
                }
            }
            longestStreak = Math.max(longestStreak, currentRun);
        }

        // Create activity map for calendar view
        const calendarMap = new Map<string, boolean>();
        for (const dateStr of sortedDates) {
            calendarMap.set(dateStr, true);
        }
        
        return { currentStreak, longestStreak, activityMap: calendarMap };
    }, [activity]);

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 34; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                date,
                isFuture: false, // Not handling future days for now
                isActive: activityMap.has(toDateString(date)),
            });
        }
        return days;
    }, [activityMap]);

    return (
        <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-scale-in z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Activity Streak</h4>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
                        <p className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-1">
                           <FireIcon className="h-7 w-7"/> {currentStreak}
                        </p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</p>
                        <p className="text-3xl font-bold text-blue-500">{longestStreak}</p>
                    </div>
                </div>
                <div>
                     <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Last 35 days</p>
                     <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map(({ date, isActive }, index) => (
                            <div key={index} className="group relative">
                                <div className={`w-full aspect-square rounded ${isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 text-center z-10 whitespace-nowrap">
                                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StreakDropdown;
