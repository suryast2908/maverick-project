



import React, { useState, useEffect } from 'react';
import { UserProfile, Skill, SkillLevel, WorkExperience, Education } from '../../types';
import { ROLES } from '../../constants/roles';
import { BADGE_LIST } from '../../constants/badges';
import Button from '../Button';
import Card from '../Card';
import UserIcon from '../icons/UserIcon';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import Modal from '../Modal';
import { v4 as uuidv4 } from 'uuid';


interface ProfilePageProps {
    user: UserProfile;
    onUpdateProfile: (profileData: Partial<UserProfile>, resumeFile: File | null) => Promise<void>;
    isSubmitting: boolean;
    onSignOut: () => void;
}

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL", "HTML/CSS", "Solidity"
];

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateProfile, isSubmitting, onSignOut }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    const resetFormData = () => {
        setFormData({
            name: user.name || '',
            headline: user.headline || '',
            location: user.location || '',
            githubUsername: user.githubUsername || '',
            linkedinUrl: user.linkedinUrl || '',
            bio: user.bio || '',
            gender: user.gender || 'Prefer not to say',
            dateOfBirth: user.dateOfBirth || '',
            currentRole: user.currentRole || 'Not specified',
            dreamRole: user.dreamRole || 'Not specified',
            skills: user.skills ? JSON.parse(JSON.stringify(user.skills)) : [],
            workExperience: user.workExperience ? JSON.parse(JSON.stringify(user.workExperience)) : [],
            education: user.education ? JSON.parse(JSON.stringify(user.education)) : [],
        });
        setResumeFile(null);
        setFileName('');
        setError('');
    };
    
    useEffect(() => {
        resetFormData();
    }, [user]);

    const handleCancel = () => {
        resetFormData();
        setIsEditing(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.headline) {
            setError("Name and Headline are required.");
            return;
        }
        await onUpdateProfile(formData, resumeFile);
        setIsEditing(false);
    };

    const claimedBadgesDetails = (user.claimedBadges || [])
        .map(badgeId => BADGE_LIST.find(b => b.id === badgeId))
        .filter(Boolean);

    return (
        <div className="max-w-6xl mx-auto">
             <Modal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} title={`${user.name}'s Resume`} size="2xl">
                {user.resumeUrl ? (
                    <iframe src={user.resumeUrl} width="100%" height="700px" title="Resume Viewer" className="border-none"></iframe>
                ) : (
                    <p>No resume available to display.</p>
                )}
            </Modal>
            <Card title="My Profile" icon={<UserIcon />}>
                <div className="p-4 space-y-8">
                     {/* --- Profile Header & Edit Toggle --- */}
                     <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img src={user.avatar} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                        <div className="flex-grow text-center sm:text-left">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                            <p className="text-md text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                            )}
                            <Button variant="danger" onClick={onSignOut}>Sign Out</Button>
                        </div>
                     </div>
                    
                    {isEditing ? (
                        <EditProfileView
                            formData={formData}
                            setFormData={setFormData}
                            setResumeFile={setResumeFile}
                            fileName={fileName}
                            setFileName={setFileName}
                            formError={error}
                        />
                    ) : (
                        <DisplayProfileView user={user} claimedBadgesDetails={claimedBadgesDetails} onViewResume={() => setIsResumeModalOpen(true)} />
                    )}
                </div>
            </Card>
        </div>
    );
};

// --- DISPLAY VIEW ---
const DisplayProfileView: React.FC<{ user: UserProfile, claimedBadgesDetails: any[], onViewResume: () => void }> = ({ user, claimedBadgesDetails, onViewResume }) => (
    <div className="space-y-8 animate-fade-in">
        {/* Basic Info & AI Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{user.headline}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{user.bio || "No bio provided."}</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                    {user.location && <span>📍 {user.location}</span>}
                    {user.linkedinUrl && <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🔗 LinkedIn</a>}
                    {user.githubUsername && <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">🔗 GitHub</a>}
                    {user.resumeUrl && <Button onClick={onViewResume} size="sm" variant="secondary">View Resume</Button>}
                </div>
            </div>
            {user.resumeAnalysis?.summary && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700">
                     <h4 className="font-semibold text-blue-800 dark:text-blue-200">AI Resume Summary</h4>
                     <p className="text-sm text-blue-700 dark:text-blue-300 italic mt-2">{user.resumeAnalysis.summary}</p>
                </div>
            )}
        </div>
        
        {/* Work & Education */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Work Experience"><Timeline items={user.workExperience?.map(w => ({ title: w.role, subtitle: w.company, date: `${w.startDate} - ${w.endDate}`, description: w.description })) || []} /></Section>
            <Section title="Education"><Timeline items={user.education?.map(e => ({ title: e.degree, subtitle: e.institution, date: `${e.startDate} - ${e.endDate}`, description: e.description })) || []} /></Section>
        </div>
        
        {/* Skills & Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                    {user.skills?.map(skill => <span key={skill.name} className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full">{skill.name}</span>)}
                </div>
            </Section>
            <Section title="Badges">
                <div className="flex flex-wrap gap-6">
                    {claimedBadgesDetails.length > 0 ? claimedBadgesDetails.map(badge => badge && (
                        <div key={badge.id} className="flex flex-col items-center text-center group relative cursor-pointer w-20">
                            <div className="text-green-500 dark:text-green-400"><badge.icon className="h-12 w-12" /></div>
                            <p className="text-xs mt-1 text-gray-800 dark:text-gray-200 font-semibold">{badge.name}</p>
                        </div>
                    )) : <p className="text-gray-500 text-sm">No badges earned yet.</p>}
                </div>
            </Section>
        </div>
    </div>
);

// --- EDIT VIEW ---
const EditProfileView: React.FC<{
    formData: Partial<UserProfile>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<UserProfile>>>;
    setResumeFile: (file: File | null) => void;
    fileName: string;
    setFileName: (name: string) => void;
    formError: string;
}> = ({ formData, setFormData, setResumeFile, fileName, setFileName, formError }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type === "application/pdf" && file.size < 5 * 1024 * 1024) {
                setResumeFile(file);
                setFileName(file.name);
            } else {
                alert("Please upload a PDF file smaller than 5MB.");
                setResumeFile(null);
                setFileName('');
            }
        }
    };
    
    // Generic handler for array fields (Work Experience, Education)
    const handleDynamicListChange = (listName: 'workExperience' | 'education', index: number, field: string, value: string) => {
        const list = formData[listName] as any[] || [];
        const newList = [...list];
        newList[index] = { ...newList[index], [field]: value };
        setFormData(prev => ({ ...prev, [listName]: newList }));
    };

    const addDynamicListItem = (listName: 'workExperience' | 'education') => {
        const list = formData[listName] as any[] || [];
        const newItem = listName === 'workExperience'
            ? { id: uuidv4(), role: '', company: '', startDate: '', endDate: '', description: '' }
            : { id: uuidv4(), institution: '', degree: '', startDate: '', endDate: '', description: '' };
        setFormData(prev => ({ ...prev, [listName]: [...list, newItem] }));
    };

    const removeDynamicListItem = (listName: 'workExperience' | 'education', id: string) => {
        const list = formData[listName] as any[] || [];
        setFormData(prev => ({ ...prev, [listName]: list.filter(item => item.id !== id) }));
    };

    return (
    <div className="space-y-6 animate-fade-in">
        {formError && <p className="text-red-500 text-center">{formError}</p>}
        {/* Basic Info */}
        <Section title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Full Name" name="name" value={formData.name || ''} onChange={handleChange} required />
                <InputField label="Headline" name="headline" value={formData.headline || ''} onChange={handleChange} placeholder="e.g., Software Engineer" required />
                <InputField label="Location" name="location" value={formData.location || ''} onChange={handleChange} placeholder="e.g., San Francisco, CA" />
                <SelectField label="Gender" name="gender" value={formData.gender || ''} onChange={handleChange}>
                    <option>Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option>
                </SelectField>
                <InputField label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handleChange} />
                <TextAreaField label="Bio / Description" name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} />
            </div>
        </Section>

        {/* Professional Info */}
        <Section title="Professional Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="LinkedIn Profile URL" name="linkedinUrl" value={formData.linkedinUrl || ''} onChange={handleChange} />
                <InputField label="GitHub Username" name="githubUsername" value={formData.githubUsername || ''} onChange={handleChange} />
                 <SelectField label="Current Role" name="currentRole" value={formData.currentRole || ''} onChange={handleChange}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</SelectField>
                 <SelectField label="Desired Role" name="dreamRole" value={formData.dreamRole || ''} onChange={handleChange}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</SelectField>
            </div>
        </Section>
        
        {/* Work Experience */}
        <Section title="Work Experience">
            <div className="space-y-4">
                {formData.workExperience?.map((exp, index) => (
                    <div key={exp.id} className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 border rounded-md relative">
                         <InputField label="Role" value={exp.role} onChange={e => handleDynamicListChange('workExperience', index, 'role', e.target.value)} />
                         <InputField label="Company" value={exp.company} onChange={e => handleDynamicListChange('workExperience', index, 'company', e.target.value)} />
                         <InputField label="Start Date" type="month" value={exp.startDate} onChange={e => handleDynamicListChange('workExperience', index, 'startDate', e.target.value)} />
                         <InputField label="End Date" type="month" value={exp.endDate} onChange={e => handleDynamicListChange('workExperience', index, 'endDate', e.target.value)} />
                         <TextAreaField className="col-span-2" label="Description" value={exp.description} onChange={e => handleDynamicListChange('workExperience', index, 'description', e.target.value)} rows={2} />
                         <button type="button" onClick={() => removeDynamicListItem('workExperience', exp.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon /></button>
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={() => addDynamicListItem('workExperience')}>Add Work Experience</Button>
            </div>
        </Section>

        {/* Education */}
        <Section title="Education">
             <div className="space-y-4">
                {formData.education?.map((edu, index) => (
                    <div key={edu.id} className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 border rounded-md relative">
                         <InputField label="Institution" value={edu.institution} onChange={e => handleDynamicListChange('education', index, 'institution', e.target.value)} />
                         <InputField label="Degree" value={edu.degree} onChange={e => handleDynamicListChange('education', index, 'degree', e.target.value)} />
                         <InputField label="Start Date" type="month" value={edu.startDate} onChange={e => handleDynamicListChange('education', index, 'startDate', e.target.value)} />
                         <InputField label="End Date" type="month" value={edu.endDate} onChange={e => handleDynamicListChange('education', index, 'endDate', e.target.value)} />
                         <TextAreaField className="col-span-2" label="Description" value={edu.description} onChange={e => handleDynamicListChange('education', index, 'description', e.target.value)} rows={2}/>
                         <button type="button" onClick={() => removeDynamicListItem('education', edu.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon /></button>
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={() => addDynamicListItem('education')}>Add Education</Button>
            </div>
        </Section>
        
        {/* Resume */}
        <Section title="Update Resume">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Uploading a new resume will trigger an AI analysis to update your profile details automatically.</p>
            <input type="file" id="resume-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <label htmlFor="resume-upload" className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-4 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex justify-center items-center">
               <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName || "Click to upload PDF (Max 5MB)"}</span>
            </label>
        </Section>
    </div>
    )
};


// --- SHARED SUB-COMPONENTS ---
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{title}</h3>
        {children}
    </div>
);

const Timeline: React.FC<{ items: { title: string, subtitle: string, date: string, description: string }[] }> = ({ items }) => {
    if (items.length === 0) return <p className="text-sm text-gray-500">No information provided.</p>;
    return (
        <div className="space-y-6 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
            {items.map((item, index) => (
                <div key={index} className="relative pl-6">
                    <div className="absolute -left-[7px] top-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-gray-400">{item.date}</p>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</h4>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.subtitle}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
            ))}
        </div>
    );
};

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{props.label}</label>
    <input {...props} id={props.name} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
  </div>
);

const TextAreaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
  <div className={props.className}>
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{props.label}</label>
    <textarea {...props} id={props.name} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
  </div>
);

const SelectField = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
  <div>
    <label htmlFor={props.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{props.label}</label>
    <select {...props} id={props.name} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500">{props.children}</select>
  </div>
);


export default ProfilePage;