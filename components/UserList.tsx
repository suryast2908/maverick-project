import React, { useState } from 'react';
import { UserProfile, SkillLevel } from '../types';
import ProgressBar from './ProgressBar';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import TrashIcon from './icons/TrashIcon';

interface UserListProps {
  users: UserProfile[];
  onViewUser: (userId: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
}

const skillLevelColor: Record<SkillLevel, string> = {
  'Expert': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-300',
  'Advanced': 'bg-purple-500/20 text-purple-600 dark:text-purple-300',
  'Intermediate': 'bg-blue-500/20 text-blue-600 dark:text-blue-300',
  'Basic': 'bg-gray-500/20 text-gray-600 dark:text-gray-300',
};

const UserRow: React.FC<{ user: UserProfile; isExpanded: boolean; onToggle: () => void; onViewUser: (userId: string) => void; onDeleteUser: (userId: string, userName: string) => void; index: number; }> = ({ user, isExpanded, onToggle, onViewUser, onDeleteUser, index }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isActive = user.lastUpdated !== 'N/A' && new Date(user.lastUpdated) > thirtyDaysAgo;

    return (
        <>
            <tr onClick={onToggle} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer animate-fade-in-stagger" style={{ animationDelay: `${index * 50}ms` }}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                        {user.skills.slice(0, 3).map(skill => (
                            <span key={skill.name} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${skillLevelColor[skill.level]}`}>
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                    <span className={`font-bold ${user.assessmentScore > 80 ? 'text-green-500' : user.assessmentScore > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {user.assessmentScore > 0 ? `${user.assessmentScore}%` : 'N/A'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                        {isActive ? 'Active' : 'Idle'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.lastUpdated}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUser(user.id, user.name);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title={`Delete ${user.name}`}
                        aria-label={`Delete ${user.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-500 ml-2" aria-label="Expand details">
                         {isExpanded ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5" />}
                    </button>
                </td>
            </tr>
            <tr>
                <td colSpan={6} className="p-0">
                    <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 space-y-4">
                            <h4 className="font-bold text-gradient">User Progress</h4>
                            <ProgressBar steps={user.progress} />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <InfoItem label="Current Role" value={user.currentRole} />
                                <InfoItem label="Desired Role" value={user.dreamRole} />
                                <InfoItem label="GitHub" value={user.githubUsername ? `@${user.githubUsername}` : 'N/A'} />
                                <InfoItem label="Registration Date" value="N/A" />
                            </div>
                             <div className="flex justify-end">
                                <button onClick={() => onViewUser(user.id)} className="text-sm font-semibold text-blue-500 hover:underline">
                                    View Full Profile →
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
};

const InfoItem: React.FC<{label: string, value?: string}> = ({label, value}) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{value || 'Not Specified'}</p>
    </div>
);

const UserList: React.FC<UserListProps> = ({ users, onViewUser, onDeleteUser }) => {
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const handleToggle = (userId: string) => {
        setExpandedUserId(prev => (prev === userId ? null : userId));
    };

    return (
        <div className="bg-transparent overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Top Skills</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Latest Score</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user, index) => (
                            <UserRow 
                                key={user.id} 
                                user={user} 
                                index={index}
                                isExpanded={expandedUserId === user.id} 
                                onToggle={() => handleToggle(user.id)}
                                onViewUser={onViewUser}
                                onDeleteUser={onDeleteUser}
                            />
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-500 dark:text-gray-400">
                                    No users match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;