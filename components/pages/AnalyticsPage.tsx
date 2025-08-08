

import React, { useState, useMemo } from 'react';
import { UserProfile, ProgressInsights, SkillLevel } from '../../types';
import { generateUserProgressInsights } from '../../services/geminiService';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import Button from '../Button';
import Card from '../Card';
import LightbulbIcon from '../icons/LightbulbIcon';
import TrophyIcon from '../icons/TrophyIcon';
import CodeIcon from '../icons/CodeIcon';
import ChartBarIcon from '../icons/ChartBarIcon';
import BookOpenIcon from '../icons/BookOpenIcon';
import UserIcon from '../icons/UserIcon';

interface AnalyticsPageProps {
    user: UserProfile;
}

const InsightCard: React.FC<{title: string, content: string, icon: React.ReactNode}> = ({title, content, icon}) => (
    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
        <div className="flex items-center mb-2">
            <span className="text-blue-500 dark:text-blue-400 mr-2">{icon}</span>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>
    </div>
);

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ user }) => {
    const [insights, setInsights] = useState<ProgressInsights | null>(null);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [insightsError, setInsightsError] = useState<string | null>(null);

    const handleGenerateInsights = async () => {
        setIsLoadingInsights(true);
        setInsightsError(null);
        try {
            const result = await generateUserProgressInsights(user);
            setInsights(result);
        } catch (err: any) {
            setInsightsError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoadingInsights(false);
        }
    };

    const languageFocusData = useMemo(() => {
        const counts = user.activity.reduce((acc, item) => {
            acc[item.language] = (acc[item.language] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const colors = ["#3b82f6", "#10b981", "#f97316", "#ec4899", "#8b5cf6", "#f59e0b", "#6366f1", "#d946ef"];
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
        }));
    }, [user.activity]);
    
    const learningModuleData = useMemo(() => {
        const modules = user.learningPaths?.flatMap(p => p.modules) || [];
        if (modules.length === 0) return [];
        const completed = modules.filter(m => m.completed).length;
        const pending = modules.length - completed;
        return [
            { name: 'Completed', value: completed, color: '#10b981' },
            { name: 'Pending', value: pending, color: '#f59e0b' },
        ];
    }, [user.learningPaths]);

    const activityScoreData = useMemo(() => {
        return (user.activity || [])
            .filter(a => typeof a.score === 'number')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-12)
            .map(a => ({
                label: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: a.score!
            }));
    }, [user.activity]);

    const skillProficiencyData = useMemo(() => {
        const levelMap: Record<SkillLevel, number> = { 'Basic': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
        return (user.skills || []).map(skill => ({
            label: skill.name,
            value: levelMap[skill.level] || 0
        }));
    }, [user.skills]);
    
    const skillLevelLabels = ['N/A', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    const resumeAnalysis = user.resumeAnalysis;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gradient">My Analytics Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Learning Module Completion" icon={<ChartBarIcon />}>
                    <PieChart data={learningModuleData} />
                </Card>
                 <Card title="Language Focus" icon={<ChartBarIcon />}>
                    <PieChart data={languageFocusData} />
                </Card>
                 <Card title="Activity Score Over Time" icon={<ChartBarIcon />}>
                    <LineChart data={activityScoreData} color="#3b82f6" />
                </Card>
                 <Card title="Skill Proficiency" icon={<ChartBarIcon />}>
                    <BarChart data={skillProficiencyData} color="#8b5cf6" yAxisLabels={skillLevelLabels} />
                </Card>
            </div>

            <Card title="Resume Analysis" icon={<UserIcon />}>
                <div className="p-2">
                    {!resumeAnalysis ? (
                        <p className="text-center text-gray-500 py-8">No resume analysis found. Please upload a resume on your profile page to generate one.</p>
                    ) : (
                        <div className="animate-fade-in space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">AI Summary:</h4>
                                <p className="text-sm italic text-gray-600 dark:text-gray-300 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md border-l-4 border-blue-400">{resumeAnalysis.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">Top Skills Identified:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {resumeAnalysis.extractedSkills?.map((skill, index) => (
                                        <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <Card title="AI-Generated Insights" icon={<LightbulbIcon />}>
                {!insights && !isLoadingInsights && (
                    <div className="text-center p-8">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Click the button to generate personalized insights and recommendations based on your activity.</p>
                        <Button onClick={handleGenerateInsights} icon={<LightbulbIcon />}>
                            Generate Insights
                        </Button>
                    </div>
                )}
                {isLoadingInsights && (
                    <div className="text-center p-8">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce"></div>
                            <span className="ml-2 text-gray-600 dark:text-gray-300">Analyzing your progress...</span>
                        </div>
                    </div>
                )}
                {insightsError && <div className="text-center p-4 bg-red-500/10 text-red-500 rounded-lg">{insightsError}</div>}
                {insights && (
                     <div className="p-2 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InsightCard title="Progress Summary" content={insights.progressSummary} icon={<TrophyIcon />} />
                            <InsightCard title="Language Analysis" content={insights.languageAnalysis} icon={<CodeIcon />} />
                            <InsightCard title="Activity Analysis" content={insights.inactivityAnalysis} icon={<ChartBarIcon />} />
                            <InsightCard title="Next Steps" content={insights.nextSteps} icon={<BookOpenIcon />} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleGenerateInsights} variant="secondary" size="sm">Regenerate</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AnalyticsPage;
