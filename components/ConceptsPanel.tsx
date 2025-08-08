import React, { useState, useMemo } from 'react';
import { CONCEPT_LIST, ALL_TOPICS } from '../constants/concepts';
import { ConceptListItem } from '../types';
import Card from './Card';
import LightbulbIcon from './icons/LightbulbIcon';

interface ConceptsPanelProps {
  onSelectConcept: (conceptSlug: string) => void;
}

const DifficultyPill: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
    const colors = {
        Easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-600/50',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-600/50',
        Hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-600/50',
    };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[difficulty]}`}>
            {difficulty}
        </span>
    );
};

const TopicTag: React.FC<{ topic: string }> = ({ topic }) => (
    <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs font-medium rounded-full">
        {topic}
    </span>
);


const ConceptsPanel: React.FC<ConceptsPanelProps> = ({ onSelectConcept }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');

  const filteredConcepts = useMemo(() => {
    return CONCEPT_LIST.filter(concept => {
      const matchesSearch = concept.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = selectedDifficulty === 'All' || concept.difficulty === selectedDifficulty;
      const matchesTopic = selectedTopic === 'All' || concept.topics.includes(selectedTopic);
      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [searchTerm, selectedDifficulty, selectedTopic]);

  return (
    <Card title="Select a Concept" icon={<LightbulbIcon />}>
      <div className="space-y-4">
        {/* Filter Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty:</label>
            <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option>All</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
           <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Topic:</label>
            <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option>All</option>
              {ALL_TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </div>
        </div>

        {/* Concepts Table */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Difficulty</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Topics</th>
                    </tr>
                </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredConcepts.map(concept => (
                        <tr key={concept.id} onClick={() => onSelectConcept(concept.id)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{concept.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <DifficultyPill difficulty={concept.difficulty} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                    {concept.topics.slice(0, 3).map(topic => <TopicTag key={topic} topic={topic} />)}
                                </div>
                            </td>
                        </tr>
                    ))}
                     {filteredConcepts.length === 0 && (
                        <tr>
                            <td colSpan={3} className="text-center py-12 text-gray-500">
                                No concepts match your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </Card>
  );
};

export default ConceptsPanel;
