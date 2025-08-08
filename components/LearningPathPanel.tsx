import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import BookOpenIcon from './icons/BookOpenIcon';
import InteractiveTutor from './InteractiveTutor';
import { TutorPace } from '../types';

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL", "HTML/CSS", "Solidity"
];

const LearningPathPanel: React.FC = () => {
  const [language, setLanguage] = useState('JavaScript');
  const [topic, setTopic] = useState('');
  const [pace, setPace] = useState<TutorPace>('Intermediate');
  const [isTutoring, setIsTutoring] = useState(false);
  const [submittedTopic, setSubmittedTopic] = useState('');

  const handleStartTutor = () => {
    if (topic.trim()) {
      setSubmittedTopic(topic);
      setIsTutoring(true);
    }
  };

  const handleExitTutor = (nextTopicSuggestion?: string) => {
    setIsTutoring(false);
    setSubmittedTopic('');
    if (nextTopicSuggestion) {
      setTopic(nextTopicSuggestion);
    } else {
      setTopic(''); // Clear topic on exit if no suggestion
    }
  };

  if (isTutoring) {
    return (
      <Card title="Interactive Tutor" icon={<BookOpenIcon />}>
        <InteractiveTutor
          topic={`Topic: ${submittedTopic}, Language: ${language}`}
          pace={pace}
          onExit={handleExitTutor}
        />
      </Card>
    );
  }

  return (
    <Card title="Personalized Learning" icon={<BookOpenIcon />}>
      <div className="space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a language and enter a topic you want to learn about. Our AI Tutor will generate a personalized lesson for you.
        </p>
        <div>
          <label htmlFor="lp-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Programming Language</label>
          <select
            id="lp-language"
            name="language"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="lp-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What do you want to learn?</label>
          <input
            id="lp-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'React Hooks', 'Async/Await', 'CSS Flexbox'"
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Pace</h4>
          <div className="flex space-x-2">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
              <button
                key={level}
                type="button"
                className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  pace === level
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setPace(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleStartTutor} disabled={!topic.trim()}>
            Start Learning
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LearningPathPanel;