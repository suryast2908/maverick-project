
import React, { useState, useEffect, useMemo } from 'react';
import UserList from './UserList';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import KnowledgeBasePanel from './KnowledgeBasePanel';
import HackathonRequestsPanel from './HackathonRequestsPanel';
import CreateHackathonModal from './CreateHackathonModal';
import CreateAssessmentModal from './CreateAssessmentModal';
import { UserProfile, KnowledgeDocument, HackathonRequest } from '../types';
import { getAllUsers, deleteUser } from '../services/authService';
import { getHackathonRequests, updateHackathonRequestStatus } from '../services/hackathonService';
import ChartBarIcon from './icons/ChartBarIcon';
import CogIcon from './icons/CogIcon';
import TrophyIcon from './icons/TrophyIcon';
import UserIcon from './icons/UserIcon';
import CodeIcon from './icons/CodeIcon';

type AppView = 'general' | 'learning_path' | 'assessment' | 'hackathons' | 'playground' | 'admin' | 'profile' | 'leaderboard' | 'analytics' | 'discussions' | 'reports';

interface AdminDashboardProps {
    knowledgeDocuments: KnowledgeDocument[];
    onAddDocument: (title: string, content: string) => Promise<void>;
    onRemoveDocument: (id: string) => Promise<void>;
    onSetViewingUser: (userId: string) => void;
    onSetView: (view: AppView) => void;
}

const StatCard: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => {
    return (
        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg text-blue-500 dark:text-blue-300">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h4>
                    <div className="text-gray-900 dark:text-gray-100">{children}</div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ knowledgeDocuments, onAddDocument, onRemoveDocument, onSetViewingUser, onSetView }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: '' });
    const [hackathonRequests, setHackathonRequests] = useState<HackathonRequest[]>([]);
    const [isCreateHackathonModalOpen, setIsCreateHackathonModalOpen] = useState(false);
    const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] = useState(false);
    
    // State for filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSkill, setFilterSkill] = useState('All');
    const [filterScore, setFilterScore] = useState('All');
    const [filterLearningPath, setFilterLearningPath] = useState('All');
    const [filterActivity, setFilterActivity] = useState<'All' | 'Active' | 'Inactive'>('All');


    const fetchAllData = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const usersPromise = getAllUsers();
            const requestsPromise = getHackathonRequests();

            const [fetchedUsers, requests] = await Promise.all([usersPromise, requestsPromise]);
            
            const uniqueUsers = Array.from(new Map(fetchedUsers.map(user => [user.id, user])).values());
            
            setUsers(uniqueUsers);
            setHackathonRequests(requests);
        } catch (error: any) {
            console.error("Failed to fetch admin data:", error);
            if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
                 setFetchError("Could not load administrator data due to insufficient permissions. Please ensure your account has the 'admin' role and that Firestore security rules are configured correctly.");
            } else {
                setFetchError("An unexpected error occurred while loading administrator data.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);
    
    const allSkills = useMemo(() => {
        const skillsSet = new Set<string>();
        users.forEach(user => {
            user.skills.forEach(skill => skillsSet.add(skill.name));
        });
        return ['All', ...Array.from(skillsSet).sort()];
    }, [users]);

    const allLearningPaths = useMemo(() => {
        const pathSet = new Set<string>();
        users.forEach(user => {
            user.learningPaths?.forEach(path => pathSet.add(path.title));
        });
        return ['All', ...Array.from(pathSet).sort()];
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = user.name.toLowerCase().includes(lowerSearchTerm) || user.email.toLowerCase().includes(lowerSearchTerm);
            const matchesSkill = filterSkill === 'All' || user.skills.some(s => s.name === filterSkill);
            const matchesLearningPath = filterLearningPath === 'All' || user.learningPaths?.some(p => p.title === filterLearningPath);
            
            const matchesScore = filterScore === 'All' || (
                (filterScore === '0-50' && user.assessmentScore <= 50) ||
                (filterScore === '51-80' && user.assessmentScore > 50 && user.assessmentScore <= 80) ||
                (filterScore === '81-100' && user.assessmentScore > 80)
            );

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const isActive = user.lastUpdated !== 'N/A' && new Date(user.lastUpdated) > thirtyDaysAgo;

            const matchesActivity = filterActivity === 'All' ||
                (filterActivity === 'Active' && isActive) ||
                (filterActivity === 'Inactive' && !isActive);

            return matchesSearch && matchesSkill && matchesScore && matchesLearningPath && matchesActivity;
        });
    }, [users, searchTerm, filterSkill, filterScore, filterLearningPath, filterActivity]);


    const showMsgModal = (title: string, body: string) => {
        setModalContent({ title, body });
        setIsMsgModalOpen(true);
    };

    const handleUpdateRequest = async (requestId: string, status: 'approved' | 'rejected', hackathonId?: string) => {
        try {
            await updateHackathonRequestStatus(requestId, status, hackathonId);
            setHackathonRequests(prev =>
                prev.map(req =>
                    req.id === requestId ? { ...req, status, hackathonId } : req
                )
            );
        } catch (error) {
            console.error("Failed to update request status:", error);
            alert("Could not update the request status. Please try again.");
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (window.confirm(`Are you sure you want to delete the user "${userName}"? This will remove their data permanently and cannot be undone.`)) {
            try {
                await deleteUser(userId);
                setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
                alert(`User ${userName} has been deleted.`);
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert(`An error occurred while deleting the user: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    const userManagementFilters = (
        <div className="flex flex-wrap items-center gap-2">
            <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
            />
            <select
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            >
                {allSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                ))}
            </select>
             <select
                value={filterScore}
                onChange={(e) => setFilterScore(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="All">All Scores</option>
                <option value="81-100">81-100%</option>
                <option value="51-80">51-80%</option>
                <option value="0-50">0-50%</option>
            </select>
            <select
                value={filterActivity}
                onChange={(e) => setFilterActivity(e.target.value as any)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>
            <select
                value={filterLearningPath}
                onChange={(e) => setFilterLearningPath(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
            >
                {allLearningPaths.map(path => (
                    <option key={path} value={path}>{path}</option>
                ))}
            </select>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isMsgModalOpen}
                onClose={() => setIsMsgModalOpen(false)}
                title={modalContent.title}
            >
                <p>{modalContent.body}</p>
            </Modal>

            <CreateHackathonModal
                isOpen={isCreateHackathonModalOpen}
                onClose={() => setIsCreateHackathonModalOpen(false)}
                onHackathonCreated={() => {
                    alert("New Hackathon Created Successfully!");
                    fetchAllData();
                }}
            />

            <CreateAssessmentModal
                isOpen={isCreateAssessmentModalOpen}
                onClose={() => setIsCreateAssessmentModalOpen(false)}
                onAssessmentCreated={() => {
                    alert("New Assessment Published Successfully!");
                }}
            />

            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-gradient mb-4">Admin Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Users" icon={<UserIcon className="h-6 w-6"/>}>
                            <p className="text-2xl font-bold text-gradient">{isLoading ? '...' : users.length}</p>
                        </StatCard>
                        <StatCard title="Assessments Today" icon={<CodeIcon className="h-6 w-6"/>}>
                             <p className="text-2xl font-bold text-gradient">893</p>
                        </StatCard>
                        <StatCard title="Active Hackathons" icon={<TrophyIcon className="h-6 w-6"/>}>
                             <p className="text-2xl font-bold text-gradient">12</p>
                        </StatCard>
                         <StatCard title="Reports" icon={<ChartBarIcon className="h-6 w-6"/>}>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-1"
                                onClick={() => onSetView('reports')}
                            >
                                View Reports
                            </Button>
                        </StatCard>
                    </div>
                </div>

                <Card title="User Management" icon={<UserIcon className="h-5 w-5" />} headerActions={userManagementFilters}>
                    {isLoading ? (
                        <div className="text-center p-8">Loading users...</div>
                    ) : fetchError ? (
                        <div className="p-4 m-4 bg-red-500/10 text-red-600 dark:text-red-300 rounded-lg text-center">
                            <h4 className="font-bold">Error Loading Data</h4>
                            <p className="text-sm">{fetchError}</p>
                        </div>
                    ) : (
                        <UserList users={filteredUsers} onViewUser={onSetViewingUser} onDeleteUser={handleDeleteUser} />
                    )}
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <HackathonRequestsPanel 
                        requests={hackathonRequests} 
                        onUpdateRequest={handleUpdateRequest}
                        onRefresh={fetchAllData}
                    />

                    <KnowledgeBasePanel
                        documents={knowledgeDocuments}
                        onAddDocument={onAddDocument}
                        onRemoveDocument={onRemoveDocument}
                    />
                </div>

                <Card title="Platform Management" icon={<CogIcon className="h-5 w-5" />}>
                    <div className="flex flex-wrap gap-4">
                        <Button onClick={() => setIsCreateHackathonModalOpen(true)}>Create Hackathon</Button>
                        <Button onClick={() => setIsCreateAssessmentModalOpen(true)}>Create Assessment</Button>
                        <Button variant='secondary' onClick={() => showMsgModal('System Settings', 'System-wide settings and configurations will be managed from here.')}>System Settings</Button>
                    </div>
                </Card>
            </div>
        </>
    );
};

export default AdminDashboard;
