

import React from 'react';
import { UserProfile } from '../types';
import Card from './Card';
import ClipboardListIcon from './icons/ClipboardListIcon';
import TrophyIcon from './icons/TrophyIcon';

interface AssessmentHistoryPanelProps {
    user: UserProfile;
    onViewResult: (resultId: string) => void;
}

const AssessmentHistoryPanel: React.FC<AssessmentHistoryPanelProps> = ({ user, onViewResult }) => {
    const pastAssessments = user.activity
        .filter(act => (act.type === 'assessment' || act.type === 'quiz') && act.resultId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8">
            <Card title="Upcoming Assessments" icon={<ClipboardListIcon />}>
                <div className="text-center p-8">
                    <p className="text-gray-500">There are no scheduled assessments. You can start a new assessment from the 'Skill Check' tab.</p>
                </div>
            </Card>

            <Card title="Past Assessments" icon={<TrophyIcon />}>
                {pastAssessments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No past assessment results found.</p>
                ) : (
                    <div className="space-y-3">
                        {pastAssessments.map((activity) => (
                            <div 
                                key={activity.resultId} 
                                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all duration-200"
                                onClick={() => onViewResult(activity.resultId!)}
                            >
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                        {activity.language} {activity.type === 'assessment' ? 'Assessment' : 'Quiz'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Completed on: {new Date(activity.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-300">{activity.score}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AssessmentHistoryPanel;