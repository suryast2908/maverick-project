


import React, { useState } from 'react';
import CodeIcon from '../icons/CodeIcon';
import LightbulbIcon from '../icons/LightbulbIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import ClipboardCheckIcon from '../icons/ClipboardCheckIcon';
import ConceptsPanel from '../ConceptsPanel';
import SkillCheckPanel from '../SkillCheckPanel';
import AssessmentHistoryPanel from '../AssessmentHistoryPanel';
import PersonalizedAssessmentsPanel from '../PersonalizedAssessmentsPanel';
import { UserProfile, QuizConfig } from '../../types';

interface AssessmentPageProps {
  user: UserProfile;
  onUpdateUser: (updatedUserData: Partial<UserProfile>) => Promise<void>;
  onSelectConcept: (conceptSlug: string) => void;
  onStartQuiz: (config: QuizConfig) => void;
  onViewResult: (resultId: string) => void;
}

type AssessmentView = 'concepts' | 'skill_check' | 'history' | 'personalized';

const AssessmentPage: React.FC<AssessmentPageProps> = ({ user, onUpdateUser, onSelectConcept, onStartQuiz, onViewResult }) => {
  const [activeTab, setActiveTab] = useState<AssessmentView>('concepts');
  
  const tabs = [
    { id: 'concepts', name: 'Concepts', icon: <LightbulbIcon className="h-5 w-5"/> },
    { id: 'skill_check', name: 'Skill Check', icon: <CodeIcon className="h-5 w-5"/> },
    { id: 'personalized', name: 'Personalized', icon: <ClipboardCheckIcon className="h-5 w-5"/> },
    { id: 'history', name: 'History', icon: <ClipboardListIcon className="h-5 w-5" /> }
  ];

  return (
    <div className="space-y-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AssessmentView)}
                    className={`flex items-center gap-2 px-4 py-3 -mb-px font-semibold text-sm transition-colors ${activeTab === tab.id ? 'border-b-2 border-blue-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                >
                    {tab.icon} {tab.name}
                </button>
            ))}
        </div>

        <div className="animate-fade-in">
            {activeTab === 'concepts' && (
                <ConceptsPanel onSelectConcept={onSelectConcept} />
            )}
            {activeTab === 'skill_check' && (
                <SkillCheckPanel user={user} onStartQuiz={onStartQuiz} />
            )}
            {activeTab === 'personalized' && (
                <PersonalizedAssessmentsPanel user={user} onStartQuiz={onStartQuiz} />
            )}
            {activeTab === 'history' && (
                <AssessmentHistoryPanel user={user} onViewResult={onViewResult} />
            )}
        </div>
    </div>
  );
};

export default AssessmentPage;