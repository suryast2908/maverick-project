

import React, { useState, useEffect } from 'react';
import { UserProfile, SkillLevel } from '../types';
import { getUserProfileById } from '../services/authService';
import { createNotification } from '../services/notificationService';
import { generateUserProfilePdf } from '../utils/reportGenerator';
import Card from './Card';
import Button from './Button';
import ProgressBar from './ProgressBar';
import UserAnalytics from './UserAnalytics';
import Modal from './Modal';
import UserIcon from './icons/UserIcon';
import CodeIcon from './icons/CodeIcon';
import CogIcon from './icons/CogIcon';

interface AdminUserProfileViewProps {
  userId: string;
  onBack: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
);

const skillLevelColor: Record<SkillLevel, string> = {
  'Expert': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-300',
  'Advanced': 'bg-purple-500/20 text-purple-600 dark:text-purple-300',
  'Intermediate': 'bg-blue-500/20 text-blue-600 dark:text-blue-300',
  'Basic': 'bg-gray-500/20 text-gray-600 dark:text-gray-300',
};

const AdminUserProfileView: React.FC<AdminUserProfileViewProps> = ({ userId, onBack }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [note, setNote] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [noteModalConfig, setNoteModalConfig] = useState({ title: '', placeholder: '' });
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        getUserProfileById(userId)
            .then(userProfile => {
                if (userProfile) {
                    setProfile(userProfile);
                } else {
                    setError("User not found.");
                }
            })
            .catch(err => {
                console.error("Failed to fetch user profile:", err);
                setError("An error occurred while fetching the user's profile.");
            })
            .finally(() => setIsLoading(false));
    }, [userId]);
    
    const handleOpenNoteModal = (title: string, placeholder: string) => {
        setNoteModalConfig({ title, placeholder });
        setNote('');
        setIsNoteModalOpen(true);
    };

    const handleSendNotification = async () => {
        if (!note.trim() || !profile) return;
        setIsSending(true);
        try {
            await createNotification(profile.id, note, 'admin_request');
            alert('Notification sent successfully!');
            setIsNoteModalOpen(false);
            setNote('');
        } catch (error) {
            console.error("Failed to send notification:", error);
            alert("Could not send notification. Please try again.");
        } finally {
            setIsSending(false);
        }
    };
    
    const handleGenerateReport = () => {
        if (!profile) return;
        try {
            generateUserProfilePdf(profile);
        } catch (error) {
            console.error("Failed to generate PDF report:", error);
            alert("An error occurred while generating the report.");
        }
    };


    if (isLoading) {
        return <div className="text-center p-12">Loading user profile...</div>;
    }

    if (error) {
        return <div className="text-center p-12 text-red-500">{error}</div>;
    }

    if (!profile) {
        return <div className="text-center p-12">No user data available.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <Modal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                title={noteModalConfig.title}
            >
                <div className="space-y-4">
                    <label htmlFor="note-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Add a note for the user:
                    </label>
                    <textarea
                        id="note-textarea"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm"
                        placeholder={noteModalConfig.placeholder}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSendNotification} disabled={isSending}>
                            {isSending ? 'Sending...' : 'Send Request'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} title={`${profile.name}'s Resume`} size="2xl">
                {profile.resumeUrl ? (
                    <iframe src={profile.resumeUrl} width="100%" height="700px" title="Resume Viewer" className="border-none"></iframe>
                ) : (
                    <p>No resume available to display.</p>
                )}
            </Modal>
            
            <Button onClick={onBack} variant="secondary">← Back to Dashboard</Button>
            
            <Card title="User Profile" icon={<UserIcon />}>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4">
                    <img src={profile.avatar} alt={profile.name} className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                        <p className="text-md text-gray-500 dark:text-gray-400">{profile.headline}</p>
                        <p className="text-sm text-blue-500 dark:text-blue-400">{profile.email}</p>
                    </div>
                </div>
            </Card>
            
            <Card title="Workflow Progress" icon={<CodeIcon />}>
                <ProgressBar steps={profile.progress} />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Problems Solved" value={profile.questionsSolved || 0} />
                <StatCard title="Last Assessment" value={`${profile.assessmentScore}%`} />
                <StatCard title="Learning Paths" value={profile.learningPaths?.length || 0} />
            </div>

            <UserAnalytics activity={profile.activity} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Skills" icon={<UserIcon/>}>
                     <div className="flex flex-wrap gap-2">
                        {profile.skills.map(skill => (
                          <span key={skill.name} className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${skillLevelColor[skill.level]}`}>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                 </Card>
                 <Card title="Manual Overrides" icon={<CogIcon/>}>
                      <div className="flex flex-wrap gap-2">
                         <Button variant="secondary" onClick={() => alert('Triggering re-assessment...')}>Re-assess</Button>
                         <Button variant="secondary" onClick={() => handleOpenNoteModal(
                           `Send update request to ${profile.name}`,
                           "e.g., Please update your skills and recent project experience."
                         )}>Update Profile</Button>
                         <Button variant="secondary" onClick={() => handleOpenNoteModal(
                           `Send review request to ${profile.name}`,
                           "e.g., Please review your latest submission for the Python assessment."
                         )}>Request Review</Button>
                         <Button variant="secondary" onClick={() => setIsResumeModalOpen(true)} disabled={!profile.resumeUrl}>View Resume</Button>
                         <Button variant="primary" onClick={handleGenerateReport}>Generate Report</Button>
                      </div>
                 </Card>
            </div>
        </div>
    );
};

export default AdminUserProfileView;