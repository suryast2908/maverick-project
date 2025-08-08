

import React, { useState } from 'react';
import { UserProfile, Skill, SkillLevel } from '../types';
import { ROLES } from '../constants/roles';
import Button from './Button';
import Card from './Card';
import UserIcon from './icons/UserIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface RegistrationFormProps {
    user: UserProfile;
    onRegister: (profileData: Partial<UserProfile>, resumeFile: File | null) => Promise<void>;
    isSubmitting: boolean;
}

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL", "HTML/CSS", "Solidity"
];

const RegistrationForm: React.FC<RegistrationFormProps> = ({ user, onRegister, isSubmitting }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        headline: '',
        location: '',
        githubUsername: '',
        currentRole: 'Not specified',
        dreamRole: 'Not specified',
    });
    const [skills, setSkills] = useState<Skill[]>([]);
    const [newSkill, setNewSkill] = useState<{ name: string; level: SkillLevel, isOther: boolean }>({ name: 'JavaScript', level: 'Intermediate', isOther: false });
    const [otherSkillName, setOtherSkillName] = useState('');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type === "application/pdf" && file.size < 5 * 1024 * 1024) { // 5MB limit
                setResumeFile(file);
                setFileName(file.name);
                setError('');
            } else {
                setError("Please upload a PDF file smaller than 5MB.");
                setResumeFile(null);
                setFileName('');
            }
        }
    };

    const handleAddSkill = () => {
        const skillName = newSkill.isOther ? otherSkillName.trim() : newSkill.name;
        if (!skillName || skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
            setError(skillName ? "Skill already added." : "Please specify a skill name.");
            return;
        }
        setSkills([...skills, { name: skillName, level: newSkill.level, assessmentDifficulty: 'Intermediate' }]);
        setNewSkill({ name: 'JavaScript', level: 'Intermediate', isOther: false });
        setOtherSkillName('');
        setError('');
    };
    
    const handleRemoveSkill = (skillNameToRemove: string) => {
        setSkills(skills.filter(s => s.name !== skillNameToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.headline) {
            setError("Name and Headline are required.");
            return;
        }
        if (skills.length === 0) {
            setError("Please add at least one skill.");
            return;
        }

        const profileData: Partial<UserProfile> = {
            ...formData,
            skills,
        };
        onRegister(profileData, resumeFile);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 animate-fade-in">
            <div className="max-w-4xl w-full">
                <Card title="Complete Your Profile" icon={<UserIcon />}>
                    <form onSubmit={handleSubmit} className="space-y-8 p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user.email}! Let's set up your profile to personalize your experience.</p>
                        
                        {/* --- Basic Info --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200" />
                            </div>
                            <div>
                                <label htmlFor="headline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                                <input type="text" name="headline" id="headline" value={formData.headline} onChange={handleChange} placeholder="e.g., Software Engineer | Aspiring AI Specialist" required className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200" />
                            </div>
                             <div>
                                <label htmlFor="currentRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Role</label>
                                <select name="currentRole" id="currentRole" value={formData.currentRole} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200">
                                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="dreamRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desired Role</label>
                                <select name="dreamRole" id="dreamRole" value={formData.dreamRole} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200">
                                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} placeholder="e.g., San Francisco, CA" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200" />
                            </div>
                             <div>
                                <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub Username</label>
                                <input type="text" name="githubUsername" id="githubUsername" value={formData.githubUsername} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200" />
                            </div>
                        </div>

                        {/* --- Skills Section --- */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">My Skills</h3>
                             <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {skills.map(skill => (
                                        <span key={skill.name} className="flex items-center bg-blue-100 dark:bg-blue-600/50 text-blue-800 dark:text-blue-200 text-sm font-medium px-3 py-1 rounded-full">
                                            {skill.name} ({skill.level})
                                            <button type="button" onClick={() => handleRemoveSkill(skill.name)} className="ml-2 text-blue-700 dark:text-blue-100 hover:text-blue-900 dark:hover:text-white">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </span>
                                    ))}
                                    {skills.length === 0 && <p className="text-gray-500 text-sm">Add your skills below.</p>}
                                </div>
                                <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skill</label>
                                        {newSkill.isOther ? (
                                            <input type="text" value={otherSkillName} onChange={e => setOtherSkillName(e.target.value)} placeholder="Enter skill name" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm" />
                                        ) : (
                                            <select value={newSkill.name} onChange={e => setNewSkill(prev => ({...prev, name: e.target.value, isOther: e.target.value === 'Other'}))} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm">
                                                {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                                <option value="Other">Other...</option>
                                            </select>
                                        )}
                                    </div>
                                     <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proficiency</label>
                                        <select value={newSkill.level} onChange={e => setNewSkill(prev => ({...prev, level: e.target.value as SkillLevel}))} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm">
                                            {(['Basic', 'Intermediate', 'Advanced', 'Expert'] as SkillLevel[]).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                        </select>
                                    </div>
                                    <Button type="button" variant="secondary" onClick={handleAddSkill}>Add Skill</Button>
                                </div>
                            </div>
                        </div>
                        
                        {/* --- Resume Upload --- */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Resume (PDF only)</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF up to 5MB</p>
                                </div>
                            </div>
                             {fileName && <p className="text-sm text-green-500 dark:text-green-400 mt-2 text-center">File selected: {fileName}</p>}
                        </div>

                        {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
                        
                        <div className="pt-4 flex justify-end">
                             <Button type="submit" disabled={isSubmitting} size="lg" icon={<PlusIcon/>}>
                                {isSubmitting ? 'Saving Profile...' : 'Complete Registration'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default RegistrationForm;