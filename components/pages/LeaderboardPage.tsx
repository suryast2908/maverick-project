
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { getAllUsers } from '../../services/authService';
import { BADGE_LIST, Badge } from '../../constants/badges';
import Card from '../Card';
import Button from '../Button';
import TrophyIcon from '../icons/TrophyIcon';
import BadgeIcon from '../icons/BadgeIcon';

type View = 'leaderboard' | 'achievements' | 'badges';

const LeaderboardPage: React.FC<{ user: UserProfile; onClaimBadge: (badgeId: string) => void; isSubmitting: boolean; }> = ({ user, onClaimBadge, isSubmitting }) => {
    const [view, setView] = useState<View>('leaderboard');
    const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (view === 'leaderboard') {
            setIsLoading(true);
            getAllUsers()
                .then(users => {
                    const sortedUsers = users.sort((a, b) => (b.questionsSolved || 0) - (a.questionsSolved || 0));
                    setLeaderboard(sortedUsers);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [view]);

    const renderLeaderboard = () => {
        if (isLoading) return <div className="text-center p-8">Loading leaderboard...</div>;
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Problems Solved</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {leaderboard.map((player, index) => (
                            <tr key={player.id} className={player.id === user.id ? 'bg-blue-500/10' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-10 w-10 rounded-full" src={player.avatar} alt={player.name} />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{player.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold text-blue-600 dark:text-blue-400">{player.questionsSolved || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderAchievements = () => (
        <div className="space-y-4">
            {(user.hackathonResults || []).length > 0 ? (
                (user.hackathonResults || []).map((result, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{result.hackathonTitle}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date(result.date).toLocaleDateString()}</p>
                        </div>
                        <span className="py-1 px-3 rounded-full text-sm font-semibold bg-green-500/20 text-green-700 dark:text-green-300">{result.status}</span>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500 py-8">Participate in a hackathon to see your achievements here.</p>
            )}
        </div>
    );
    
    const renderBadges = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BADGE_LIST.map(badge => {
                const isUnlocked = badge.isUnlocked(user);
                const isClaimed = user.claimedBadges?.includes(badge.id);
                const canClaim = isUnlocked && !isClaimed;

                return (
                    <div key={badge.id} className={`p-4 rounded-lg flex flex-col items-center text-center transition-all duration-300 ${isClaimed ? 'bg-green-500/10 border-green-500/50' : isUnlocked ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'} border`}>
                        <div className={`mb-3 ${isUnlocked ? (isClaimed ? 'text-green-500 dark:text-green-400' : 'text-yellow-500 dark:text-yellow-400') : 'text-gray-400 dark:text-gray-500'}`}>
                            <badge.icon className="h-16 w-16" />
                        </div>
                        <h4 className={`font-bold text-lg ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>{badge.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex-grow mt-1">{badge.description}</p>
                        <div className="mt-4 h-10">
                            {canClaim && (
                                <Button size="sm" onClick={() => onClaimBadge(badge.id)} disabled={isSubmitting}>
                                    {isSubmitting ? 'Claiming...' : 'Claim Badge'}
                                </Button>
                            )}
                            {isClaimed && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-700 dark:text-green-300">
                                    ✓ Claimed
                                </span>
                            )}
                            {!isUnlocked && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    Locked
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const views: { id: View, name: string, content: () => React.ReactNode }[] = [
        { id: 'leaderboard', name: 'Leaderboard', content: renderLeaderboard },
        { id: 'achievements', name: 'Hackathon History', content: renderAchievements },
        { id: 'badges', name: 'Badges', content: renderBadges }
    ];

    return (
        <Card title="Leaderboard & Achievements" icon={<TrophyIcon />}>
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {views.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setView(v.id)}
                        className={`px-4 py-2 -mb-px font-semibold text-sm transition-colors ${view === v.id ? 'border-b-2 border-blue-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                    >
                        {v.name}
                    </button>
                ))}
            </div>
            <div>
                {views.find(v => v.id === view)?.content()}
            </div>
        </Card>
    );
};

export default LeaderboardPage;