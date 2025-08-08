import React from 'react';
import { UserProfile, ProgrammingQuestion } from '../../types';
import DailyMissionPanel from '../DailyMissionPanel';
import SelectConceptPanel from '../SelectConceptPanel';
import XPBar from '../XPBar';
import ActivityFeed from '../ActivityFeed';

type AppView = 'general' | 'learning_path' | 'assessment' | 'hackathons' | 'playground' | 'admin' | 'profile' | 'leaderboard' | 'analytics' | 'discussions' | 'reports';

interface GeneralPageProps {
    user: UserProfile;
    onStartMission: (config: { language: string; question: ProgrammingQuestion; }) => void;
    onSetView: (view: AppView) => void;
}

const GeneralPage: React.FC<GeneralPageProps> = ({ user, onStartMission, onSetView }) => {
    
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome & XP Bar */}
            <div>
                 <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Welcome back, <span className="text-gradient">{user.name.split(' ')[0]}!</span></h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-2">{user.headline || "Ready to code? Let's get started."}</p>
            </div>
            
            <XPBar user={user} />
            
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                     <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Featured</h2>
                        <button onClick={() => onSetView('assessment')} className="px-4 py-1 text-sm font-semibold text-blue-600 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors">
                            More
                        </button>
                    </div>
                    <div className="space-y-8">
                        <DailyMissionPanel user={user} onStartMission={onStartMission} />
                        <SelectConceptPanel onSetView={() => onSetView('assessment')} />
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <ActivityFeed activity={user.activity} />
                </div>
            </div>
        </div>
    );
};

export default GeneralPage;