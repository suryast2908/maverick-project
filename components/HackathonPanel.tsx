import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import TrophyIcon from './icons/TrophyIcon';
import Modal from './Modal';
import { Hackathon } from '../types';

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL"
];

const mockHackathons: Omit<Hackathon, 'id'>[] = [
    {
        title: 'Decentralized Future Hack',
        description: 'Explore the potential of blockchain technology.',
        status: 'Upcoming',
        startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 12)),
        bannerUrl: 'https://images.unsplash.com/photo-1639762681057-408e52192e50?q=80&w=2070&auto=format&fit=crop',
        logoUrl: '',
        rules: ['Teams of 2-4', 'Must use at least one decentralized technology', 'Submit a working prototype'],
        prizes: ['1st: $5000', '2nd: $2500', '3rd: $1000'],
        problemStatements: [
            { id: 'ps1', title: 'Decentralized Identity', description: 'Create a self-sovereign identity solution.', difficulty: 'Hard', tags: ['Blockchain', 'Identity'] },
            { id: 'ps2', title: 'NFT Marketplace', description: 'Build a marketplace for unique digital assets.', difficulty: 'Medium', tags: ['NFT', 'Web3'] },
        ]
    },
    {
        title: 'Cloud Native Sprint',
        description: 'Develop a scalable cloud-native application.',
        status: 'Completed',
        startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        endDate: new Date(new Date().setDate(new Date().getDate() - 8)),
        bannerUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop',
        logoUrl: '',
        rules: ['Must be deployed on a major cloud provider', 'Code must be open source'],
        prizes: ['1st: Cloud Credits', '2nd: Swag Pack'],
        problemStatements: [
            { id: 'ps3', title: 'Serverless API', description: 'Design and deploy a highly scalable serverless API.', difficulty: 'Medium', tags: ['Cloud', 'Serverless', 'API'] },
        ]
    },
];

interface HackathonPanelProps {
    onStartChallenge: (language: string) => void;
}

const HackathonPanel: React.FC<HackathonPanelProps> = ({ onStartChallenge }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [challengeLanguage, setChallengeLanguage] = useState('Python');
    const [joinStatus, setJoinStatus] = useState<'idle' | 'joined'>('idle');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const handleJoinClick = () => {
        setShowToast(true);
        setJoinStatus('joined');
    };

    const handleParticipateClick = () => {
        setIsModalOpen(true);
    };

    const handleStartClick = () => {
        onStartChallenge(challengeLanguage);
        setIsModalOpen(false);
    };

    const AIForgoodChallenge = { id: 1, title: 'AI for Good Challenge', description: 'Build an AI application to solve a real-world problem.', status: 'Ongoing' };
    
  return (
    <>
      {/* Language Selection Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Select Your Language"
      >
        <div className="space-y-4">
            <p>Choose the programming language you want to use for the challenge.</p>
            <select
              id="challenge-language"
              name="language"
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
              value={challengeLanguage}
              onChange={(e) => setChallengeLanguage(e.target.value)}
            >
              {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <div className="flex justify-end pt-2">
                <Button onClick={handleStartClick}>Start Challenge</Button>
            </div>
        </div>
      </Modal>

      {/* Join Success Toast */}
      {showToast && (
        <div className="fixed bottom-10 right-10 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up z-50">
            You have joined the daily challenge successfully!
        </div>
      )}

      <Card title="Hackathons" icon={<TrophyIcon />}>
          <div className="space-y-4">
              {/* AI for Good Challenge - Special Interactive Version */}
               <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center border-l-4 border-blue-500 dark:border-blue-400">
                  <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{AIForgoodChallenge.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{AIForgoodChallenge.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-xs font-bold py-1 px-2.5 rounded-full bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300`}>
                          {AIForgoodChallenge.status}
                      </span>
                      {joinStatus === 'idle' && (
                         <Button size="sm" className="mt-2 w-28" onClick={handleJoinClick}>
                              Join
                          </Button>
                      )}
                      {joinStatus === 'joined' && (
                         <Button size="sm" className="mt-2 w-28" onClick={handleParticipateClick}>
                              Participate
                          </Button>
                      )}
                  </div>
              </div>

              {/* Other Mock Hackathons */}
              {mockHackathons.map((h, i) => (
                  <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                      <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">{h.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{h.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                          <span className={`text-xs font-bold py-1 px-2 rounded-full ${
                              h.status === 'Ongoing' ? 'bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300' : 
                              h.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300' : 'bg-gray-500/20 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300'
                          }`}>{h.status}</span>
                           <Button variant="secondary" size="sm" className="mt-2 opacity-50 cursor-not-allowed">
                              {h.status === 'Completed' ? 'View Results' : 'Join'}
                          </Button>
                      </div>
                  </div>
              ))}
          </div>
      </Card>
    </>
  );
};

export default HackathonPanel;