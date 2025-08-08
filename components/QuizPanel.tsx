

import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import CodeIcon from './icons/CodeIcon';
import { QuizConfig } from '../types';

interface QuizPanelProps {
    onStartQuiz: (config: QuizConfig) => void;
    isLoading: boolean;
}

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL"
];

const QuizPanel: React.FC<QuizPanelProps> = ({ onStartQuiz, isLoading }) => {
  const [config, setConfig] = useState<Omit<QuizConfig, 'type'>>({
    language: 'Python',
    difficulty: 'Intermediate',
    numberOfQuestions: 10,
    numberOfProgrammingQuestions: 1,
    customTopic: '',
  });

  const handleStartClick = () => {
    onStartQuiz({ ...config, type: 'quiz' });
  }

  const handleTotalQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = parseInt(e.target.value, 10);
    setConfig(prev => ({
        ...prev,
        numberOfQuestions: newTotal,
        // Adjust programming questions if it exceeds the new total
        numberOfProgrammingQuestions: Math.min(prev.numberOfProgrammingQuestions, newTotal)
    }));
  }
  
  const isButtonDisabled = isLoading;

  return (
    <Card title="Evaluate Yourself" icon={<CodeIcon />}>
      <div className="space-y-6">
        <div>
          <label htmlFor="quiz-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Programming Language</label>
          <select
            id="quiz-language"
            name="language"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            value={config.language}
            onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
          >
            {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>

        <div>
            <label htmlFor="quiz-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Topic (Optional)</label>
            <input
                id="quiz-topic"
                type="text"
                value={config.customTopic}
                onChange={(e) => setConfig(prev => ({ ...prev, customTopic: e.target.value }))}
                placeholder="e.g., 'React Hooks', 'Async/Await', 'Graph Algorithms'"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</h4>
          <div className="flex space-x-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
              <button
                key={level}
                type="button"
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  config.difficulty === level 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
            <label htmlFor="num-questions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Questions ({config.numberOfQuestions})</label>
            <input
                id="num-questions"
                type="range"
                min="1"
                max="30"
                value={config.numberOfQuestions}
                onChange={handleTotalQuestionsChange}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        
        <div>
            <label htmlFor="num-prog-questions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number of Programming Questions ({config.numberOfProgrammingQuestions})</label>
            <input
                id="num-prog-questions"
                type="range"
                min="0"
                max={config.numberOfQuestions}
                value={config.numberOfProgrammingQuestions}
                onChange={(e) => setConfig(prev => ({...prev, numberOfProgrammingQuestions: parseInt(e.target.value, 10)}))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        
        <div className="flex justify-end pt-2">
          <Button onClick={handleStartClick} disabled={isButtonDisabled}>
            {isLoading ? 'Generating Quiz...' : 'Start Quiz'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuizPanel;