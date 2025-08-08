import React from 'react';
import { UserProfile } from '../types';
import { XP_PER_LEVEL, calculateLevel } from '../utils/xp';

interface XPBarProps {
    user: UserProfile;
}

const XPBar: React.FC<XPBarProps> = ({ user }) => {
    const currentXP = user.xp || 0;
    const currentLevel = calculateLevel(currentXP);
    const xpForNextLevel = currentLevel * XP_PER_LEVEL;
    const xpForCurrentLevel = (currentLevel - 1) * XP_PER_LEVEL;
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100));

    return (
        <div className="bg-white dark:bg-[#161b22] p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-blue-500 text-lg">Level {currentLevel}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{currentXP} / {xpForNextLevel} XP</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            <p className="text-xs text-right text-gray-500 dark:text-gray-400 mt-1">
                {xpForNextLevel - currentXP} XP to next level
            </p>
        </div>
    );
};

export default XPBar;
