

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, DiscussionThread } from '../../types';
import { getAllUsers } from '../../services/authService';
import { getThreads } from '../../services/discussionService';
import { generateAdminUsageReportPdf, AdminReportData } from '../../utils/reportGenerator';
import Button from '../Button';
import Card from '../Card';
import ChartBarIcon from '../icons/ChartBarIcon';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';

interface ReportsPageProps {
    onBack: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-[#161b22] p-6 rounded-xl border border-gray-200 dark:border-gray-700/50">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-4xl font-bold text-gradient mt-2">{value}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>
    </div>
);

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [threads, setThreads] = useState<DiscussionThread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const usersPromise = getAllUsers();
                const threadsPromise = getThreads({ category: 'All Categories', language: 'All Languages', difficulty: 'All Levels', status: 'All Posts', sortBy: 'Newest', scope: 'All Threads'}, '');
                const [fetchedUsers, fetchedThreads] = await Promise.all([usersPromise, threadsPromise]);
                setUsers(fetchedUsers);
                setThreads(fetchedThreads);
            } catch (err) {
                console.error(err);
                setError("Failed to load analytics data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const analyticsData = useMemo<AdminReportData | null>(() => {
        if (users.length === 0 || threads.length === 0) return null;

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const activeUsers = users.filter(u => new Date(u.lastUpdated) > oneDayAgo).length;
        
        const topUsersByXp = [...users].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 5);

        const contributorMap = new Map<string, { id: string; name: string; avatar: string; posts: number; score: number }>();
        threads.forEach(thread => {
            if (!contributorMap.has(thread.authorId)) {
                contributorMap.set(thread.authorId, { id: thread.authorId, name: thread.authorName, avatar: thread.authorAvatar, posts: 0, score: 0 });
            }
            const contributor = contributorMap.get(thread.authorId)!;
            contributor.posts += 1;
            contributor.score += 5 + (thread.upvotes - thread.downvotes);
        });
        
        const topContributors = Array.from(contributorMap.values()).sort((a, b) => b.score - a.score).slice(0, 5);

        const skillCounts = users.flatMap(u => u.skills).reduce((acc, skill) => {
            acc[skill.name] = (acc[skill.name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#f59e0b", "#6366f1", "#d946ef"];
        const skillDistribution = Object.entries(skillCounts).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));

        return {
            totalUsers: users.length,
            activeUsers,
            inactiveUsers: users.length - activeUsers,
            siteHealth: "99.8%", // Mock data
            topUsersByXp,
            topContributors,
            skillDistribution,
        };
    }, [users, threads]);
    
    const featureUsageData = useMemo(() => {
        if (!users) return [];
        const activityTypes = users.flatMap(u => u.activity).map(a => a.type);
        const counts = activityTypes.reduce((acc, type) => {
            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
            acc[capitalizedType] = (acc[capitalizedType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([label, value]) => ({label, value}));
    }, [users]);


    if (isLoading) return <div className="text-center p-16">Loading analytics...</div>;
    if (error) return <div className="text-center p-16 text-red-500">{error}</div>;
    if (!analyticsData) return <div className="text-center p-16">Not enough data to generate a report.</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gradient">Platform Analytics Report</h1>
                <div className="flex gap-2">
                    <Button onClick={onBack} variant="secondary">← Back to Admin</Button>
                    <Button onClick={() => generateAdminUsageReportPdf(analyticsData)}>Generate PDF Report</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={analyticsData.totalUsers} description="All registered users." />
                <StatCard title="Active Users" value={analyticsData.activeUsers} description="Active in last 24 hours." />
                <StatCard title="Inactive Users" value={analyticsData.inactiveUsers} description="Not active in last 24 hours." />
                <StatCard title="Site Health" value={analyticsData.siteHealth} description="Simulated uptime." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Skill Distribution" icon={<ChartBarIcon />}><PieChart data={analyticsData.skillDistribution} /></Card>
                <Card title="Feature Usage" icon={<ChartBarIcon />}><BarChart data={featureUsageData} color="#10b981" /></Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Top Users by XP" icon={<ChartBarIcon />}>
                    <table className="min-w-full">
                        <tbody>
                            {analyticsData.topUsersByXp.map((user, i) => (
                                <tr key={user.id} className="border-b dark:border-gray-700">
                                    <td className="py-2 text-center font-bold">{i+1}</td>
                                    <td className="py-2 flex items-center gap-2">
                                        <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                        <span>{user.name}</span>
                                    </td>
                                    <td className="py-2 text-right font-semibold">{user.xp || 0} XP</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </Card>
                 <Card title="Top Community Contributors" icon={<ChartBarIcon />}>
                    <table className="min-w-full">
                        <tbody>
                            {analyticsData.topContributors.map((c, i) => (
                                <tr key={c.id} className="border-b dark:border-gray-700">
                                    <td className="py-2 text-center font-bold">{i+1}</td>
                                    <td className="py-2 flex items-center gap-2">
                                        <img src={c.avatar} className="w-8 h-8 rounded-full" />
                                        <span>{c.name}</span>
                                    </td>
                                    <td className="py-2 text-right font-semibold">{c.score} score</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </Card>
            </div>
        </div>
    );
};

export default ReportsPage;