import React from 'react';
import { UserActivity } from '../types';
import CodeIcon from './icons/CodeIcon';
import TrophyIcon from './icons/TrophyIcon';

interface ActivityFeedProps {
    activity: UserActivity[];
}

const ActivityIcon: React.FC<{ type: UserActivity['type'] }> = ({ type }) => {
    switch (type) {
        case 'assessment':
        case 'quiz':
            return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
        case 'playground':
        default:
            return <CodeIcon className="h-5 w-5 text-green-500" />;
    }
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
    const recentActivity = [...activity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div className="bg-white dark:bg-[#161b22] p-6 rounded-xl border border-gray-200 dark:border-gray-700/50 h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
            {recentActivity.length > 0 ? (
                <ul className="space-y-4">
                    {recentActivity.map((act, index) => (
                        <li key={act.resultId || index} className="flex items-center gap-4 animate-fade-in-stagger" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-full">
                                <ActivityIcon type={act.type} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Completed a {act.type} in {act.language}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {act.score !== undefined ? `Scored ${act.score}%` : ''} - {new Date(act.date).toLocaleDateString()}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent activity to display.</p>
            )}
        </div>
    );
};

export default ActivityFeed;
