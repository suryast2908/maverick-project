
import React, { useState } from 'react';
import { CustomAssessment, QuizConfig } from '../types';
import Button from './Button';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

interface AssessmentCardProps {
    assessment: CustomAssessment;
    onStart: (config: QuizConfig) => void;
}

const InfoPill: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="text-center bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">{label}</p>
        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
);

const DifficultyPill: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
    const colors = {
        Easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        Hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    };
    return <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-semibold rounded-full ${colors[difficulty]}`}>{difficulty}</span>;
};


const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment, onStart }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const now = new Date();
    const startDate = assessment.startDate?.toDate ? assessment.startDate.toDate() : assessment.startDate;
    const endDate = assessment.endDate?.toDate ? assessment.endDate.toDate() : assessment.endDate;


    const isAvailable = (!startDate || now >= startDate) && (!endDate || now <= endDate);
    const statusText = startDate && now < startDate
        ? `Starts on ${new Date(startDate).toLocaleDateString()}`
        : endDate && now > endDate
        ? 'Ended'
        : 'Available Now';

    return (
        <div className="bg-white dark:bg-[#161b22] rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700/50 flex flex-col overflow-hidden h-full">
            <div className="p-6 relative">
                <DifficultyPill difficulty={assessment.difficulty} />
                <h3 className="text-xl font-bold text-gradient pr-20">{assessment.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 h-10">{assessment.description}</p>
                 <div className="flex flex-wrap gap-2 mt-4">
                    {assessment.tags.map(tag => (
                        <span key={tag} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="px-6 pb-4 grid grid-cols-3 gap-3">
                <InfoPill label="Time" value={`${assessment.timeLimit}m`} />
                <InfoPill label="Questions" value={assessment.config.numberOfQuestions} />
                <InfoPill label="Language" value={assessment.config.language} />
            </div>
            {isExpanded && (
                <div className="px-6 pb-4 animate-fade-in-up space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">Instructions</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">{assessment.instructions}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">Scoring</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">{assessment.scoringPattern}</p>
                    </div>
                </div>
            )}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700/50 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <button onClick={() => setIsExpanded(prev => !prev)} className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                    {isExpanded ? <><ChevronUpIcon className="h-4 w-4" /> Hide Details</> : <><ChevronDownIcon className="h-4 w-4" /> Show Details</>}
                </button>
                 <Button onClick={() => onStart(assessment.config)} disabled={!isAvailable} title={statusText}>
                    Start Assessment
                </Button>
            </div>
        </div>
    );
};

export default AssessmentCard;
