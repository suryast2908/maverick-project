
import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import CodeIcon from './icons/CodeIcon';
import { QuizConfig, UserProfile } from '../types';

interface SkillAssessmentPanelProps {
    onStartQuiz: (config: QuizConfig) => void;
    isLoading: boolean;
    user: UserProfile;
}

const SkillAssessmentPanel: React.FC<SkillAssessmentPanelProps> = ({ onStartQuiz, isLoading, user }) => {
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);

  const programmingSkills = user.skills.filter(s => 
    ["JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go", "Ruby", "Swift", "Kotlin", "Rust", "SQL"].includes(s.name)
  );

  const handleStartClick = () => {
    if (programmingSkills.length === 0) return;
    
    const selectedSkill = programmingSkills[selectedSkillIndex];
    
    const config: QuizConfig = {
      type: 'quiz',
      language: selectedSkill.name,
      difficulty: selectedSkill.assessmentDifficulty,
      numberOfQuestions: 8, // Fixed number for a consistent check-up
      numberOfProgrammingQuestions: 1,
      customTopic: '',
    };
    onStartQuiz(config);
  }

  if (programmingSkills.length === 0) {
    return (
        <Card title="Skill Assessment" icon={<CodeIcon />}>
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Please add programming skills to your profile to generate an assessment.</p>
                 <Button className="mt-4" onClick={() => alert("Redirect to profile edit page (feature coming soon!)")}>Update Profile</Button>
            </div>
        </Card>
    );
  }
  
  const selectedSkill = programmingSkills[selectedSkillIndex];

  return (
    <Card title="Skill Assessment" icon={<CodeIcon />}>
      <div className="space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
            Let's check your knowledge! We'll generate a dynamic quiz based on one of your skills and its current difficulty level.
        </p>
        <div>
          <label htmlFor="skill-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assess my knowledge in:</label>
          <select
            id="skill-select"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            value={selectedSkillIndex}
            onChange={(e) => setSelectedSkillIndex(parseInt(e.target.value))}
          >
            {programmingSkills.map((skill, index) => <option key={skill.name} value={index}>{skill.name}</option>)}
          </select>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Assessment Difficulty</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-300">{selectedSkill.assessmentDifficulty}</p>
        </div>
        
        <div className="flex justify-end pt-2">
          <Button onClick={handleStartClick} disabled={isLoading}>
            {isLoading ? 'Generating Quiz...' : 'Start Skill Check'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SkillAssessmentPanel;