

import React from 'react';
import { UserProfile } from '../types';
import BadgeIcon from '../components/icons/BadgeIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import CodeIcon from '../components/icons/CodeIcon';
import UserIcon from '../components/icons/UserIcon';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  isUnlocked: (user: UserProfile) => boolean;
}

export const BADGE_LIST: Badge[] = [
  {
    id: 'q_1',
    name: 'First Blood',
    description: 'Successfully solve your first problem.',
    icon: CodeIcon,
    isUnlocked: (user) => (user.questionsSolved || 0) >= 1,
  },
  {
    id: 'q_10',
    name: 'Problem Solver',
    description: 'Solve 10 problems.',
    icon: CodeIcon,
    isUnlocked: (user) => (user.questionsSolved || 0) >= 10,
  },
  {
    id: 'q_50',
    name: 'Coding Machine',
    description: 'Solve 50 problems.',
    icon: CodeIcon,
    isUnlocked: (user) => (user.questionsSolved || 0) >= 50,
  },
  {
    id: 'hackathon_1',
    name: 'Competitor',
    description: 'Participate in your first hackathon.',
    icon: TrophyIcon,
    isUnlocked: (user) => (user.hackathonResults?.length || 0) >= 1,
  },
   {
    id: 'hackathon_winner',
    name: 'Hackathon Winner',
    description: 'Win a hackathon event.',
    icon: TrophyIcon,
    isUnlocked: (user) => (user.hackathonResults || []).some(r => r.status === 'Winner'),
  },
  {
    id: 'profile_complete',
    name: 'All-Star Profile',
    description: 'Completely fill out your user profile.',
    icon: UserIcon,
    isUnlocked: (user) => !!user.headline && !!user.location && user.skills.length > 0 && !!user.dreamRole && user.dreamRole !== 'Not specified',
  },
];