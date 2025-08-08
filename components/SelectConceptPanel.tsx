import React from 'react';
import Button from './Button';
import LightbulbIcon from './icons/LightbulbIcon';

interface SelectConceptPanelProps {
    onSetView: () => void;
}

const SelectConceptPanel: React.FC<SelectConceptPanelProps> = ({ onSetView }) => {
  return (
    <div className="rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-[#161b22] flex flex-col h-full transition-transform duration-300 hover:-translate-y-1">
        <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative">
            <p className="text-sm font-semibold opacity-75">Easy Collection</p>
            <h3 className="text-3xl font-extrabold mt-2 h-20">
                Top Interview Questions
            </h3>
            <button onClick={onSetView} className="absolute -bottom-7 right-6 h-14 w-14 bg-white rounded-full shadow-lg text-teal-600 flex items-center justify-center hover:scale-110 transition-transform">
                <LightbulbIcon className="h-7 w-7" />
            </button>
        </div>
        <div className="p-6 pt-10 flex-grow flex flex-col">
            <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                Browse our collection of programming problems. Filter by difficulty or topic and test your skills.
            </p>
            <div className="flex justify-between items-center text-sm mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                 <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">20+</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Concepts</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">1k+</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Items</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">0%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SelectConceptPanel;