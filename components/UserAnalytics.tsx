import React, { useMemo } from 'react';
import { UserActivity } from '../types';
import Card from './Card';
import ChartBarIcon from './icons/ChartBarIcon';
import PieChart from './charts/PieChart';
import BarChart from './charts/BarChart';


// --- Main Analytics Component ---
interface UserAnalyticsProps {
    activity: UserActivity[];
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({ activity }) => {

    const languageFocusData = useMemo(() => {
        const counts = activity.reduce((acc, item) => {
            acc[item.language] = (acc[item.language] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#f59e0b", "#6366f1", "#d946ef"];
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    }, [activity]);

    const performanceData = useMemo(() => {
        return activity
            .filter(item => item.type === 'assessment' || item.type === 'quiz')
            .map(item => ({
                label: `${item.language.substring(0,4)} (${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
                value: item.score || 0
            }));
    }, [activity]);


    if (activity.length === 0) {
        return (
             <Card title="My Analytics" icon={<ChartBarIcon />}>
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Complete an assessment or run code in the playground to see your analytics.</p>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card title="Language Focus" icon={<ChartBarIcon />}>
                <PieChart data={languageFocusData} />
            </Card>
            <Card title="Performance Over Time" icon={<ChartBarIcon />}>
                <BarChart data={performanceData} color="#3b82f6" />
            </Card>
        </div>
    );
};

export default UserAnalytics;
