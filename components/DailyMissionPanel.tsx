import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import { UserProfile, ProgrammingQuestion } from '../types';
import { getOrGenerateDailyMission } from '../services/missionService';
import PlayIcon from './icons/PlayIcon';
import CheckIcon from './icons/CheckIcon';

interface DailyMissionPanelProps {
    onStartMission: (config: { language: string, question: ProgrammingQuestion }) => void;
    user: UserProfile;
}

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL"
];

const getISTTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

const getISTDateString = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DailyMissionPanel: React.FC<DailyMissionPanelProps> = ({ onStartMission, user }) => {
    const [dailyQuestion, setDailyQuestion] = useState<ProgrammingQuestion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('Python');
    
    const [currentTime, setCurrentTime] = useState(getISTTime());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(getISTTime()), 1000);
        return () => clearInterval(timer);
    }, []);

    const todayString = useMemo(() => getISTDateString(currentTime), [currentTime]);
    const missionProgress = user.dailyMissionProgress;
    const hasCompletedToday = missionProgress?.date === todayString && missionProgress.completed;

    useEffect(() => {
        if (hasCompletedToday) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const languageForFetch = user.dailyMissionProgress?.language || 'Python';
        setSelectedLanguage(languageForFetch);

        getOrGenerateDailyMission(todayString, languageForFetch)
            .then(setDailyQuestion)
            .catch(error => console.error("Failed to load daily mission:", error))
            .finally(() => setIsLoading(false));
    }, [todayString, hasCompletedToday, user.dailyMissionProgress?.language]);

    const handleStartClick = async () => {
        if (!dailyQuestion) return;
        setIsLoading(true);
        try {
            const finalQuestion = await getOrGenerateDailyMission(todayString, selectedLanguage);
            onStartMission({ language: selectedLanguage, question: finalQuestion });
        } catch (error) {
            console.error("Failed to get mission for selected language:", error);
            setIsLoading(false);
        }
    };
    
    const hasStartedToday = user.dailyMissionProgress?.date === todayString;

    if (hasCompletedToday) {
        return (
             <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-[#161b22] flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
                <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white relative">
                    <p className="text-sm font-semibold opacity-75">Today's Challenge</p>
                    <h3 className="text-3xl font-extrabold mt-2 h-20">
                        Mission Accomplished!
                    </h3>
                    <div className="absolute -bottom-7 right-6 h-14 w-14 bg-white rounded-full shadow-lg text-emerald-600 flex items-center justify-center">
                        <CheckIcon className="h-8 w-8" />
                    </div>
                </div>
                <div className="p-6 pt-10 flex-grow flex flex-col items-center justify-center text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Awesome work! Come back tomorrow for a new challenge.
                    </p>
                </div>
            </div>
        )
    }

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-[#161b22] flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
        <div className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white relative">
            <p className="text-sm font-semibold opacity-75">Today's Challenge</p>
            <h3 className="text-3xl font-extrabold mt-2 h-20">
                {isLoading 
                    ? <div className="h-8 w-3/4 bg-white/20 rounded animate-pulse mt-2"></div> 
                    : (dailyQuestion?.questionText || 'Mission Ready')
                }
            </h3>
            <button onClick={handleStartClick} disabled={isLoading || !dailyQuestion} className="absolute -bottom-7 right-6 h-14 w-14 bg-white rounded-full shadow-lg text-indigo-600 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                <PlayIcon className="h-7 w-7 ml-1" />
            </button>
        </div>
        <div className="p-6 pt-10 flex-grow flex flex-col">
            <div className="flex justify-between items-center">
                 <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">1</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Chapter</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">1</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Item</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{hasStartedToday ? 'In Progress' : '0%'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                </div>
            </div>
            <div className="mt-auto pt-4">
                <select
                    id="mission-language"
                    name="language"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    disabled={isLoading}
                >
                    {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
            </div>
        </div>
    </div>
  );
};

export default DailyMissionPanel;