

import React, { useRef, useEffect, useState } from 'react';
import CodeIcon from './icons/CodeIcon';
import UserIcon from './icons/UserIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import TrophyIcon from './icons/TrophyIcon';
import TerminalIcon from './icons/TerminalIcon';
import CogIcon from './icons/CogIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import RouteIcon from './icons/RouteIcon';

type AppView = 'general' | 'learning_path' | 'assessment' | 'hackathons' | 'playground' | 'admin' | 'profile' | 'leaderboard' | 'analytics' | 'discussions' | 'reports';

interface SidebarProps {
    isOpen: boolean;
    currentView: AppView;
    onSetView: (view: AppView) => void;
    userRole: 'user' | 'admin';
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    refProp: React.Ref<HTMLButtonElement>;
}> = ({ icon, label, isActive, onClick, refProp }) => (
    <button
        ref={refProp}
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 relative z-10 ${
            isActive
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
        }`}
    >
        <span className="mr-4">{icon}</span>
        <span className="font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentView, onSetView, userRole, onMouseEnter, onMouseLeave }) => {
    const navItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const [gliderStyle, setGliderStyle] = useState({});

    const navLinks = [
        { view: 'general', label: 'Dashboard', icon: <TerminalIcon className="h-6 w-6" />, role: ['user', 'admin'] },
        { view: 'assessment', label: 'Assessment', icon: <CodeIcon className="h-6 w-6" />, role: ['user', 'admin'] },
        { view: 'learning_path', label: 'Learning Path', icon: <RouteIcon className="h-6 w-6" />, role: ['user', 'admin'] },
        { view: 'discussions', label: 'Discussions', icon: <ChatBubbleIcon className="h-6 w-6" />, role: ['user', 'admin'] },
        { view: 'hackathons', label: 'Hackathons', icon: <TrophyIcon className="h-6 w-6" />, role: ['user', 'admin'] },
        { view: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="h-6 w-6" />, role: ['user', 'admin'] },
        { view: 'admin', label: 'Admin', icon: <CogIcon className="h-6 w-6" />, role: ['admin'] },
    ];

    const secondaryLinks = [
        { view: 'leaderboard', label: 'Leaderboard', icon: <ChartBarIcon className="h-6 w-6" />, role: ['user', 'admin'] },
    ];

    const visibleNavLinks = navLinks.filter(link => link.role.includes(userRole));
    const visibleSecondaryLinks = secondaryLinks.filter(link => link.role.includes(userRole));
    
    useEffect(() => {
        const activeItemIndex = [...visibleNavLinks, ...visibleSecondaryLinks].findIndex(item => item.view === currentView);
        const activeItem = navItemsRef.current[activeItemIndex];

        if (activeItem) {
            setGliderStyle({
                height: `${activeItem.offsetHeight}px`,
                top: `${activeItem.offsetTop}px`,
                opacity: 1,
            });
        } else {
            setGliderStyle({
                opacity: 0,
            })
        }
    }, [currentView, userRole, isOpen, visibleNavLinks, visibleSecondaryLinks]);


    return (
        <aside
            className={`fixed top-0 left-0 h-full bg-white dark:bg-[#161b22] border-r border-gray-200 dark:border-gray-700/50 text-black dark:text-white transition-all duration-300 ease-in-out shadow-2xl z-40 w-72 pt-24 flex flex-col ${
                isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
            }`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="p-4 space-y-2 flex-grow relative">
                <div
                    className="absolute left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg transition-all duration-300 ease-in-out"
                    style={gliderStyle}
                />
                {visibleNavLinks.map((item, index) => (
                    <NavItem
                        key={item.view}
                        refProp={el => { navItemsRef.current[index] = el; }}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentView === item.view}
                        onClick={() => onSetView(item.view as AppView)}
                    />
                ))}
            </div>
             <div className="p-4 space-y-2 border-t border-gray-200 dark:border-gray-700/50 relative">
                 {visibleSecondaryLinks.map((item, index) => (
                    <NavItem
                        key={item.view}
                        refProp={el => { navItemsRef.current[visibleNavLinks.length + index] = el; }}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentView === item.view}
                        onClick={() => onSetView(item.view as AppView)}
                    />
                 ))}
            </div>
        </aside>
    );
};

export default Sidebar;