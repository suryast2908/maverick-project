import React, { useState, useMemo } from 'react';
import { UserProfile, ProgressInsights, SkillLevel } from '../types';
import { generateUserProgressInsights } from '../services/geminiService';
import Button from './Button';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import LightbulbIcon from './icons/LightbulbIcon';
import TrophyIcon from './icons/TrophyIcon';
import CodeIcon from './icons/CodeIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import Card from './Card';

interface ProgressDashboardProps {
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


const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ user }) => {
    const [insights, setInsights] = useState<ProgressInsights | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateUserProgressInsights(user);
            setInsights(result);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
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
            .slice(-12) // Show last 12 activities
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <Card title="Learning Module Completion" icon={<BookOpenIcon />}>
                    <PieChart data={learningModuleData} />
                </Card>
                <Card title="Activity Score Over Time" icon={<ChartBarIcon />}>
                    <LineChart data={activityScoreData} color="#3b82f6" />
                </Card>
                <Card title="Skill Proficiency" icon={<CodeIcon />}>
                    <BarChart data={skillProficiencyData} color="#8b5cf6" yAxisLabels={skillLevelLabels} />
                </Card>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">AI-Generated Insights</h3>
                {!insights && !isLoading && (
                    <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Click the button to generate personalized insights and recommendations based on {user.name}'s activity.</p>
                        <Button onClick={handleGenerateInsights} icon={<LightbulbIcon />}>
                            Generate Insights
                        </Button>
                    </div>
                )}
                {isLoading && (
                    <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce"></div>
                            <span className="ml-2 text-gray-600 dark:text-gray-300">Generating insights...</span>
                        </div>
                    </div>
                )}
                {error && <div className="text-center p-4 bg-red-500/10 text-red-500 rounded-lg">{error}</div>}
                {insights && (
                     <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InsightCard title="Progress Summary" content={insights.progressSummary} icon={<TrophyIcon />} />
                        <InsightCard title="Language Analysis" content={insights.languageAnalysis} icon={<CodeIcon />} />
                        <InsightCard title="Activity Analysis" content={insights.inactivityAnalysis} icon={<ChartBarIcon />} />
                        <InsightCard title="Next Steps" content={insights.nextSteps} icon={<BookOpenIcon />} />
                        <div className="md:col-span-2 flex justify-end">
                            <Button onClick={handleGenerateInsights} variant="secondary" size="sm">Regenerate</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressDashboard;
