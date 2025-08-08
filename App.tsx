import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getOrCreateUserProfile, handleSignOut as signOutService, updateUserProfile } from './services/authService';
import { getKnowledgeDocuments, addKnowledgeDocument, removeKnowledgeDocument } from './services/knowledgeBaseService';
import { getUnreadNotifications, markAllNotificationsAsRead } from './services/notificationService';
import { saveAssessmentResult } from './services/assessmentService';
import { auth, firestore } from './services/firebase';
import firebase from 'firebase/compat/app';

import AdminDashboard from './components/AdminDashboard';
import Playground from './components/Playground';
import Sidebar from './components/Sidebar';
import GeneralPage from './components/pages/GeneralPage';
import LearningPathPage from './components/pages/LearningPathPage';
import AssessmentPage from './components/pages/AssessmentPage';
import HackathonsPage from './components/pages/HackathonsPage';
import ProfilePage from './components/pages/ProfilePage';
import LeaderboardPage from './components/pages/LeaderboardPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import ReportsPage from './components/pages/ReportsPage';
import MissionView from './components/MissionView';
import Login from './components/auth/Login';
import RegistrationForm from './components/RegistrationForm';
import Button from './components/Button';
import BirdIcon from './components/icons/BirdIcon';
import TerminalIcon from './components/icons/TerminalIcon';
import HamburgerIcon from './components/icons/HamburgerIcon';
import ThemeToggle from './components/ThemeToggle';
import Chatbot from './components/Chatbot';
import ConceptSolveView from './components/ConceptSolveView';
import DiscussionsPage from './components/pages/DiscussionsPage';
import DiscussionThreadView from './components/DiscussionThreadView';
import AdminUserProfileView from './components/AdminUserProfileView';
import BellIcon from './components/icons/BellIcon';
import NotificationDropdown from './components/NotificationDropdown';
import ChallengeView from './components/ChallengeView';
import AssessmentView from './components/AssessmentView';
import AssessmentResultView from './components/AssessmentResultView';
import FireIcon from './components/icons/FireIcon';
import StreakDropdown from './components/StreakDropdown';
import { XP_VALUES, calculateLevel } from './utils/xp';


import { UserProfile, KnowledgeDocument, ProgrammingQuestion, Skill, HackathonResult, Notification, QuizConfig, EvaluationResult, UserActivity, AssessmentDifficulty } from './types';

type AppView = 'general' | 'learning_path' | 'assessment' | 'hackathons' | 'playground' | 'admin' | 'profile' | 'leaderboard' | 'analytics' | 'discussions' | 'reports';
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type Theme = 'light' | 'dark';

type ActiveMission = {
    active: boolean;
    language: string;
    question: ProgrammingQuestion;
    code: string;
}

const getISTDateString = () => {
    const now = new Date();
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const FullPageLoader: React.FC<{ message: string }> = ({ message }) => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-[#0d1117]">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500 mb-6"></div>
        <p className="text-xl text-gray-700 dark:text-gray-300">{message}</p>
    </div>
);

const App: React.FC = () => {
    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const [currentUser, setCurrentUser] = useState<{ profile: UserProfile, role: 'user' | 'admin' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

    const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarTimeout = useRef<number | null>(null);

    const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
    const [activeConceptSlug, setActiveConceptSlug] = useState<string | null>(null);
    const [activeThreadContext, setActiveThreadContext] = useState<{ id: string; scope: string; } | null>(null);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const [isStreakOpen, setIsStreakOpen] = useState(false);
    const streakRef = useRef<HTMLDivElement>(null);

    const [activeChallenge, setActiveChallenge] = useState<{ language: string } | null>(null);
    const [activeAssessment, setActiveAssessment] = useState<QuizConfig | null>(null);
    const [viewingAssessmentResultId, setViewingAssessmentResultId] = useState<string | null>(null);

    const handleSidebarEnter = useCallback(() => {
        if (sidebarTimeout.current) {
            clearTimeout(sidebarTimeout.current);
        }
        setIsSidebarOpen(true);
    }, []);

    const handleSidebarLeave = useCallback(() => {
        sidebarTimeout.current = window.setTimeout(() => {
            setIsSidebarOpen(false);
        }, 300); // Delay to allow moving mouse between trigger and sidebar
    }, []);

    // --- Routing Logic ---
    const getViewFromHash = useCallback((): AppView => {
        const hash = window.location.hash.replace('#/', '');
        const validViews: AppView[] = ['general', 'learning_path', 'assessment', 'hackathons', 'playground', 'admin', 'profile', 'leaderboard', 'analytics', 'discussions', 'reports'];
        if ((validViews as string[]).includes(hash)) {
            return hash as AppView;
        }
        return 'general'; // Default view is 'general' (home page)
    }, []);

    const [currentView, setCurrentView] = useState<AppView>(getViewFromHash);
    
    useEffect(() => {
        if (activeConceptSlug) return;
        // Sync currentView state to URL hash for bookmarking and navigation.
        window.location.hash = `/${currentView}`;
    }, [currentView, activeConceptSlug]);

    useEffect(() => {
        // Handle browser back/forward navigation by listening to hash changes.
        const handleHashChange = () => {
            if (activeConceptSlug) {
                // If user navigates while in solve view, exit solve view.
                setActiveConceptSlug(null);
            }
            if (activeThreadContext) {
                setActiveThreadContext(null);
            }
            if (viewingAssessmentResultId) {
                setViewingAssessmentResultId(null);
            }
            setCurrentView(getViewFromHash());
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [getViewFromHash, activeConceptSlug, activeThreadContext, viewingAssessmentResultId]);
    // --- End Routing Logic ---
    
     useEffect(() => {
        // Theme initialization logic is now primarily handled by the inline script in index.html to prevent FOUC.
        // This effect syncs React's state with the DOM state set by the script.
        const root = window.document.documentElement;
        setTheme(root.classList.contains('dark') ? 'dark' : 'light');

        // Auth initialization
        const unsubscribeAuth = auth.onAuthStateChanged(async (user: firebase.User | null) => {
            if (user) {
                try {
                    const userSession = await getOrCreateUserProfile(user);
                    setCurrentUser(userSession);
                    if (userSession.role === 'admin' && !userSession.profile.needsOnboarding) {
                        setCurrentView('admin');
                    }
                    setAuthStatus('authenticated');
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setAuthStatus('unauthenticated');
                }
            } else {
                setCurrentUser(null);
                setNotifications([]);
                setAuthStatus('unauthenticated');
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Notification listener
    useEffect(() => {
        if (!currentUser) return;

        const notificationsQuery = firestore.collection('notifications')
            .where('userId', '==', currentUser.profile.id)
            .orderBy('createdAt', 'desc');

        const unsubscribeNotifications = notificationsQuery.onSnapshot(snapshot => {
            const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(fetchedNotifications);
        });

        return () => unsubscribeNotifications();
    }, [currentUser]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
            if (streakRef.current && !streakRef.current.contains(event.target as Node)) {
                setIsStreakOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        const root = window.document.documentElement;
        root.classList.toggle('dark', newTheme === 'dark');
        localStorage.setItem('theme', newTheme);
    };

    useEffect(() => {
        if (authStatus === 'authenticated' && currentUser?.role === 'admin') {
            getKnowledgeDocuments().then(setKnowledgeDocs);
        }
    }, [authStatus, currentUser?.role]);

    const handleSignOut = async () => {
        await signOutService();
        setCurrentUser(null);
        setAuthStatus('unauthenticated');
        setCurrentView('general');
    };
    
    const handleRegistration = useCallback(async (profileData: Partial<UserProfile>, resumeFile: File | null) => {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            await updateUserProfile(currentUser.profile.id, profileData, resumeFile);
            
            // Manually update the local state to exit registration view
            setCurrentUser(prevUser => {
                if (!prevUser) return null;
                const updatedProfile = { 
                    ...prevUser.profile, 
                    ...profileData, 
                    needsOnboarding: false 
                };
                return { ...prevUser, profile: updatedProfile };
            });
        } catch(error) {
            console.error("Registration update failed:", error);
            // Optionally show an error to the user
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUser]);

    const handleUpdateUser = useCallback(async (updatedProfileData: Partial<UserProfile>, resumeFile: File | null = null) => {
        if (!currentUser) return;
        setIsSubmitting(true);
        try {
            const finalData = { ...updatedProfileData };
            
            // Check if a question was solved to award XP
            if (finalData.questionsSolved && finalData.questionsSolved > (currentUser.profile.questionsSolved || 0)) {
                const currentXp = currentUser.profile.xp || 0;
                const newXp = currentXp + XP_VALUES.CONCEPT_SOLVE;
                finalData.xp = newXp;
                finalData.level = calculateLevel(newXp);
            }

            await updateUserProfile(currentUser.profile.id, finalData, resumeFile);
            
            setCurrentUser(prevUser => {
                if (!prevUser) return null;
                const updatedProfile = { 
                    ...prevUser.profile, 
                    ...finalData, 
                    lastUpdated: new Date().toLocaleDateString()
                };
                return { ...prevUser, profile: updatedProfile };
            });
             if (resumeFile !== null || (updatedProfileData.name && updatedProfileData.headline)) {
                setCurrentView('general'); // Navigate back after a major update
            }
        } catch (error) {
             console.error("Profile update failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [currentUser]);

    const handleAddDoc = async (title: string, content: string) => {
        const newDoc = await addKnowledgeDocument(title, content);
        setKnowledgeDocs(prev => [newDoc, ...prev]);
    };

    const handleRemoveDoc = async (id: string) => {
        await removeKnowledgeDocument(id);
        setKnowledgeDocs(prev => prev.filter(doc => doc.id !== id));
    };

    const handleStartMission = (config: { language: string, question: ProgrammingQuestion }) => {
        if (!currentUser) return;
        const today = getISTDateString();
        const savedProgress = currentUser.profile.dailyMissionProgress;
        const initialCode = (savedProgress?.date === today && savedProgress?.language === config.language) 
            ? savedProgress.code 
            : config.question.starterCode;

        setActiveMission({
            active: true,
            language: config.language,
            question: config.question,
            code: initialCode || '',
        });
    };

    const handleMissionCodeUpdate = (newCode: string) => {
        if (!activeMission || !currentUser) return;
        setActiveMission(prev => prev ? { ...prev, code: newCode } : null);
        
        const missionProgress = {
            dailyMissionProgress: {
                date: getISTDateString(),
                language: activeMission.language,
                code: newCode,
                completed: false,
            }
        };

        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return { ...prevUser, profile: { ...prevUser.profile, ...missionProgress } };
        });
        updateUserProfile(currentUser.profile.id, missionProgress, null);
    };

    const handleMissionFinish = () => {
        if (!activeMission || !currentUser) return;
        
        const currentQuestionsSolved = currentUser.profile.questionsSolved || 0;
        const updatedQuestionsSolved = currentQuestionsSolved + 1;
        const currentXp = currentUser.profile.xp || 0;
        const newXp = currentXp + XP_VALUES.DAILY_MISSION;

        const missionProgress = {
            dailyMissionProgress: {
                date: getISTDateString(),
                language: activeMission.language,
                code: activeMission.code,
                completed: true,
            },
            questionsSolved: updatedQuestionsSolved,
            xp: newXp,
            level: calculateLevel(newXp),
        };

        updateUserProfile(currentUser.profile.id, missionProgress, null);
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return { ...prevUser, profile: { ...prevUser.profile, ...missionProgress } };
        });
        setActiveMission(null);
    };
    
    const handleMissionPause = () => {
        setActiveMission(null);
    };

    const handleChallengeFinished = () => {
        if (!currentUser) return;

        const currentQuestionsSolved = currentUser.profile.questionsSolved || 0;
        const updatedQuestionsSolved = currentQuestionsSolved + 1;

        const newHackathonResult: HackathonResult = {
            hackathonTitle: 'AI for Good Challenge',
            status: 'Participated', // Simplified for now
            date: new Date().toISOString(),
        };
        const updatedHackathonResults = [...(currentUser.profile.hackathonResults || []), newHackathonResult];
        
        const currentXp = currentUser.profile.xp || 0;
        const newXp = currentXp + XP_VALUES.CHALLENGE_PARTICIPATION;

        const updatedData = {
            questionsSolved: updatedQuestionsSolved,
            hackathonResults: updatedHackathonResults,
            xp: newXp,
            level: calculateLevel(newXp),
        };

        updateUserProfile(currentUser.profile.id, updatedData, null);
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            return { ...prevUser, profile: { ...prevUser.profile, ...updatedData } };
        });
    };
    
    const handleClaimBadge = useCallback(async (badgeId: string) => {
        if (!currentUser) return;
        
        const claimedBadges = currentUser.profile.claimedBadges || [];
        if (claimedBadges.includes(badgeId)) return;

        const updatedBadges = [...claimedBadges, badgeId];
        await updateUserProfile(currentUser.profile.id, { claimedBadges: updatedBadges }, null);

        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const updatedProfile = { 
                ...prevUser.profile, 
                claimedBadges: updatedBadges
            };
            return { ...prevUser, profile: updatedProfile };
        });
    }, [currentUser]);

    const handleMarkAllRead = async () => {
        if (!currentUser) return;
        await markAllNotificationsAsRead(currentUser.profile.id);
        // The real-time listener will automatically update the state
    };

    const handleAssessmentComplete = useCallback(async (result: EvaluationResult, session: QuizConfig) => {
        if (!currentUser) return;

        setIsSubmitting(true);
        try {
            const resultId = await saveAssessmentResult(currentUser.profile.id, session, result);

            setCurrentUser(prevUser => {
                if (!prevUser) return null;

                const newActivity: UserActivity = {
                    type: session.type,
                    language: session.language,
                    score: result.score,
                    assessmentScore: result.score,
                    date: new Date().toISOString(),
                    resultId: resultId,
                    avatar: prevUser.profile.avatar,
                };
                const updatedActivity = [...(prevUser.profile.activity || []), newActivity];

                const updatedSkills = prevUser.profile.skills.map(skill => {
                    if (skill.name === session.language) {
                        let newDifficulty: AssessmentDifficulty = skill.assessmentDifficulty;
                        if (result.score > 80 && skill.assessmentDifficulty === 'Beginner') newDifficulty = 'Intermediate';
                        else if (result.score > 80 && skill.assessmentDifficulty === 'Intermediate') newDifficulty = 'Advanced';
                        else if (result.score < 50 && skill.assessmentDifficulty === 'Advanced') newDifficulty = 'Intermediate';
                        else if (result.score < 50 && skill.assessmentDifficulty === 'Intermediate') newDifficulty = 'Beginner';
                        return { ...skill, assessmentDifficulty: newDifficulty };
                    }
                    return skill;
                });

                const currentXp = prevUser.profile.xp || 0;
                const xpGained = result.score > 80 ? XP_VALUES.ASSESSMENT_PASSED : Math.floor(XP_VALUES.ASSESSMENT_PASSED / 4);
                const newXp = currentXp + xpGained;

                const updatedProfileData = {
                    activity: updatedActivity,
                    assessmentScore: result.score,
                    skills: updatedSkills,
                    lastUpdated: new Date().toLocaleDateString(),
                    xp: newXp,
                    level: calculateLevel(newXp),
                };

                // Update firestore in the background
                updateUserProfile(prevUser.profile.id, updatedProfileData, null).catch(e => console.error("Firestore update failed", e));

                // Return new state immediately for UI update
                return {
                    ...prevUser,
                    profile: {
                        ...prevUser.profile,
                        ...updatedProfileData,
                    },
                };
            });
        } catch (error) {
            console.error("Failed to process assessment completion:", error);
        } finally {
            setIsSubmitting(false);
            setActiveAssessment(null);
        }
    }, [currentUser]);

    const handleStartChallenge = (language: string) => {
        setActiveChallenge({ language });
    };

    const handleCompleteChallenge = () => {
        handleChallengeFinished();
        setActiveChallenge(null);
    };

    const currentStreak = useMemo(() => {
        if (!currentUser?.profile.activity) return 0;
        
        const toDateString = (date: Date) => date.toISOString().split('T')[0];
        
        const activityDates = new Set(
            currentUser.profile.activity.map(act => toDateString(new Date(act.date)))
        );

        let streak = 0;
        let checkDate = new Date();

        if (activityDates.has(toDateString(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            while (activityDates.has(toDateString(checkDate))) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }
        return streak;
    }, [currentUser?.profile.activity]);

    if (authStatus === 'loading') {
        return <FullPageLoader message="Initializing Session..." />;
    }
    if (authStatus === 'unauthenticated') {
        return <Login />;
    }
    if (!currentUser) {
        return <FullPageLoader message="Loading User Profile..." />;
    }
    if (currentUser.profile.needsOnboarding) {
        return <RegistrationForm user={currentUser.profile} onRegister={handleRegistration} isSubmitting={isSubmitting} />;
    }
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const isTakingTest = !!(activeMission || activeConceptSlug || activeChallenge || activeAssessment);


    const renderMainContent = () => {
        if (activeMission?.active) {
            return <MissionView 
                question={activeMission.question}
                language={activeMission.language}
                initialCode={activeMission.code}
                onCodeChange={handleMissionCodeUpdate}
                onFinish={handleMissionFinish}
                onPause={handleMissionPause}
            />
        }
        
        if (activeConceptSlug) {
            return <ConceptSolveView
                key={activeConceptSlug} // Re-mount component when slug changes
                conceptSlug={activeConceptSlug}
                user={currentUser.profile}
                onUpdateUser={handleUpdateUser}
                onExit={() => setActiveConceptSlug(null)}
                onSolveNew={(slug) => setActiveConceptSlug(slug)}
            />;
        }

        if (activeChallenge) {
            return <ChallengeView language={activeChallenge.language} onComplete={handleCompleteChallenge} />;
        }

        if (activeAssessment) {
            return <AssessmentView
                userActivity={currentUser.profile.activity}
                config={activeAssessment}
                onComplete={(result) => handleAssessmentComplete(result, activeAssessment)}
                onCancel={() => setActiveAssessment(null)}
            />;
        }

        if (viewingAssessmentResultId) {
            return <AssessmentResultView
                resultId={viewingAssessmentResultId}
                user={currentUser.profile}
                onBack={() => setViewingAssessmentResultId(null)}
            />;
        }

        if (activeThreadContext) {
             return <DiscussionThreadView 
                key={activeThreadContext.id}
                threadId={activeThreadContext.id}
                initialScope={activeThreadContext.scope as any}
                user={currentUser}
                onBack={() => setActiveThreadContext(null)}
            />
        }
        
        if (viewingUserId) {
            return <AdminUserProfileView userId={viewingUserId} onBack={() => setViewingUserId(null)} />;
        }

        switch (currentView) {
            case 'general': return <GeneralPage user={currentUser.profile} onStartMission={handleStartMission} onSetView={setCurrentView} />;
            case 'assessment': return <AssessmentPage user={currentUser.profile} onUpdateUser={handleUpdateUser} onSelectConcept={(slug) => setActiveConceptSlug(slug)} onStartQuiz={setActiveAssessment} onViewResult={setViewingAssessmentResultId} />;
            case 'discussions': return <DiscussionsPage onSelectThread={(id, scope) => setActiveThreadContext({ id, scope })} user={currentUser} />;
            case 'learning_path': return <LearningPathPage user={currentUser.profile} onUpdateUser={handleUpdateUser} />;
            case 'hackathons': return <HackathonsPage onStartChallenge={handleStartChallenge} onChallengeFinished={handleChallengeFinished} user={currentUser.profile} />;
            case 'analytics': return <AnalyticsPage user={currentUser.profile} />;
            case 'admin': return <AdminDashboard knowledgeDocuments={knowledgeDocs} onAddDocument={handleAddDoc} onRemoveDocument={handleRemoveDoc} onSetViewingUser={setViewingUserId} onSetView={setCurrentView} />;
            case 'reports': return <ReportsPage onBack={() => setCurrentView('admin')} />;
            case 'playground': return <Playground />;
            case 'profile': return <ProfilePage user={currentUser.profile} onUpdateProfile={handleUpdateUser} isSubmitting={isSubmitting} onSignOut={handleSignOut} />;
            case 'leaderboard': return <LeaderboardPage user={currentUser.profile} onClaimBadge={handleClaimBadge} isSubmitting={isSubmitting} />;
            default: return <GeneralPage user={currentUser.profile} onStartMission={handleStartMission} onSetView={setCurrentView} />;
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#0d1117]">
            {/* Invisible hover trigger area for the sidebar */}
            <div
                className="fixed top-0 left-0 h-full w-4 z-50"
                onMouseEnter={handleSidebarEnter}
                onMouseLeave={handleSidebarLeave}
            />
            <Sidebar 
                isOpen={isSidebarOpen}
                currentView={currentView}
                onSetView={(view) => {
                  setActiveConceptSlug(null);
                  setActiveThreadContext(null);
                  setViewingAssessmentResultId(null);
                  setCurrentView(view);
                }}
                userRole={currentUser.role}
                onMouseEnter={handleSidebarEnter}
                onMouseLeave={handleSidebarLeave}
            />

            <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
                <header className="sticky top-0 z-30 bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <button 
                                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white p-2"
                                aria-label="Toggle sidebar"
                            >
                                <HamburgerIcon isOpen={isSidebarOpen} />
                            </button>
                            <button
                                onClick={() => {
                                    // Resetting active views for a clean navigation to home
                                    setActiveConceptSlug(null);
                                    setActiveThreadContext(null);
                                    setViewingAssessmentResultId(null);
                                    setActiveMission(null);
                                    setActiveChallenge(null);
                                    setActiveAssessment(null);
                                    setViewingUserId(null);
                                    setCurrentView('general');
                                }}
                                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#161b22] focus:ring-blue-500 rounded-lg"
                            >
                                <BirdIcon className="h-8 w-8 text-blue-500" />
                                <h1 className="text-xl font-black text-gray-900 dark:text-white">Mavericks</h1>
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div ref={notificationRef} className="relative">
                                <button onClick={() => setIsNotificationOpen(p => !p)} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <BellIcon />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                                {isNotificationOpen && (
                                    <NotificationDropdown
                                        notifications={notifications}
                                        onClose={() => setIsNotificationOpen(false)}
                                        onMarkAllRead={handleMarkAllRead}
                                    />
                                )}
                            </div>

                            <div ref={streakRef} className="relative">
                                <button onClick={() => setIsStreakOpen(p => !p)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <FireIcon className="h-5 w-5 text-orange-500"/>
                                    <span className="font-bold text-sm ml-1">{currentStreak}</span>
                                </button>
                                {isStreakOpen && (
                                    <StreakDropdown
                                    activity={currentUser.profile.activity}
                                    onClose={() => setIsStreakOpen(false)}
                                    />
                                )}
                            </div>

                            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView('profile')}>
                                <img src={currentUser.profile.avatar} alt="User avatar" className="w-9 h-9 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition" />
                                <span className="text-sm font-semibold hidden md:block text-gray-700 dark:text-gray-200">{currentUser.profile.name}</span>
                            </div>
                            <Button variant="secondary" onClick={() => setCurrentView('playground')}>
                                <TerminalIcon className="h-5 w-5 md:mr-2" />
                                <span className="hidden md:inline">Playground</span>
                            </Button>
                            <ThemeToggle theme={theme} onToggle={toggleTheme} />
                        </div>
                    </nav>
                </header>
            
                <main className="p-4 md:p-6">
                    {renderMainContent()}
                </main>
            </div>
            
            {!isTakingTest && <Chatbot />}
        </div>
    );
}

export default App;