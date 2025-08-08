
import React from 'react';
import { UserProfile, QuizConfig } from '../types';
import SkillAssessmentPanel from './SkillAssessmentPanel';

interface SkillCheckPanelProps {
    user: UserProfile;
    onStartQuiz: (config: QuizConfig) => void;
}

const SkillCheckPanel: React.FC<SkillCheckPanelProps> = ({ user, onStartQuiz }) => {
    return (
        <div className="animate-fade-in">
            <SkillAssessmentPanel onStartQuiz={onStartQuiz} isLoading={false} user={user} />
        </div>
    );
};

export default SkillCheckPanel;
