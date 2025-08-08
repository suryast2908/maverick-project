
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { UserProfile, CustomAssessment, QuizConfig } from '../types';
import { createCustomAssessment } from '../services/assessmentService';
import { getAllUsers } from '../services/authService';
import { auth } from '../services/firebase';

interface CreateAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssessmentCreated: (assessmentId: string) => void;
}

const programmingLanguages = ["JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go", "Ruby", "Swift", "Kotlin", "Rust", "SQL"];

const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({ isOpen, onClose, onAssessmentCreated }) => {
    // Component state
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [tags, setTags] = useState('');
    const [timeLimit, setTimeLimit] = useState(60);
    const [instructions, setInstructions] = useState('1. All questions are mandatory.\n2. Do not switch tabs during the assessment.');
    const [scoringPattern, setScoringPattern] = useState('• +10 for correct MCQ\n• No negative marking');
    const [config, setConfig] = useState<Omit<QuizConfig, 'type'>>({
        language: 'Python',
        difficulty: 'Intermediate',
        numberOfQuestions: 10,
        numberOfProgrammingQuestions: 2,
        customTopic: '',
    });
    const [assignees, setAssignees] = useState<{ type: 'ALL_USERS' | 'SPECIFIC_USERS'; userIds: string[] }>({ type: 'ALL_USERS', userIds: [] });

    useEffect(() => {
        if (isOpen && assignees.type === 'SPECIFIC_USERS' && allUsers.length === 0) {
            setIsLoadingUsers(true);
            getAllUsers()
                .then(setAllUsers)
                .catch(console.error)
                .finally(() => setIsLoadingUsers(false));
        }
    }, [isOpen, assignees.type, allUsers.length]);

    const resetForm = () => {
        setStep(1);
        setTitle('');
        setDescription('');
        setDifficulty('Medium');
        setTags('');
        setTimeLimit(60);
        setInstructions('1. All questions are mandatory.\n2. Do not switch tabs during the assessment.');
        setScoringPattern('• +10 for correct MCQ\n• No negative marking');
        setConfig({ language: 'Python', difficulty: 'Intermediate', numberOfQuestions: 10, numberOfProgrammingQuestions: 2, customTopic: '' });
        setAssignees({ type: 'ALL_USERS', userIds: [] });
    };

    const handleUserSelection = (userId: string) => {
        setAssignees(prev => {
            const newIds = prev.userIds.includes(userId)
                ? prev.userIds.filter(id => id !== userId)
                : [...prev.userIds, userId];
            return { ...prev, userIds: newIds };
        });
    };
    
    const handleSubmit = async () => {
        const adminUser = auth.currentUser;
        if (!adminUser) {
            alert("Authentication error. Please sign in again.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const assessmentData: Omit<CustomAssessment, 'id' | 'createdAt'> = {
                creatorId: adminUser.uid,
                title,
                description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                timeLimit,
                difficulty,
                instructions,
                scoringPattern,
                showLeaderboard: true, // Placeholder
                config: { ...config, type: 'quiz' },
                assignees,
            };
            const assessmentId = await createCustomAssessment(assessmentData);
            onAssessmentCreated(assessmentId);
            resetForm();
            onClose();
        } catch (error) {
            console.error("Failed to create assessment:", error);
            alert("An error occurred. Please check the console and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Personalized Assessment" size="2xl">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                {/* Stepper */}
                <div className="flex justify-center items-center gap-4 border-b pb-4">
                    <div className={`text-center ${step >= 1 ? 'text-blue-500' : 'text-gray-400'}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step >= 1 ? 'border-blue-500 bg-blue-100' : ''}`}>1</div>
                        <p className="text-xs mt-1">Details</p>
                    </div>
                    <div className={`flex-grow h-0.5 ${step > 1 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                     <div className={`text-center ${step >= 2 ? 'text-blue-500' : 'text-gray-400'}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step >= 2 ? 'border-blue-500 bg-blue-100' : ''}`}>2</div>
                        <p className="text-xs mt-1">Content</p>
                    </div>
                     <div className={`flex-grow h-0.5 ${step > 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                     <div className={`text-center ${step >= 3 ? 'text-blue-500' : 'text-gray-400'}`}>
                        <div className={`mx-auto w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step >= 3 ? 'border-blue-500 bg-blue-100' : ''}`}>3</div>
                        <p className="text-xs mt-1">Assign</p>
                    </div>
                </div>

                {/* Step 1: Details */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <InputField label="Assessment Title" value={title} onChange={e => setTitle(e.target.value)} required />
                        <TextAreaField label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={2} required />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SelectField label="Difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>{['Easy', 'Medium', 'Hard'].map(d=><option key={d}>{d}</option>)}</SelectField>
                            <InputField label="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} placeholder="React, SQL, DSA" />
                            <InputField label="Time Limit (minutes)" type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} />
                        </div>
                        <TextAreaField label="Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} />
                        <TextAreaField label="Scoring Pattern" value={scoringPattern} onChange={e => setScoringPattern(e.target.value)} rows={3} />
                    </div>
                )}
                
                {/* Step 2: Content */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <SelectField label="Programming Language" value={config.language} onChange={e => setConfig(p => ({...p, language: e.target.value}))}>{programmingLanguages.map(l=><option key={l}>{l}</option>)}</SelectField>
                        <InputField label="Custom Topic (Optional)" value={config.customTopic} onChange={e => setConfig(p => ({...p, customTopic: e.target.value}))} placeholder="e.g., React Hooks"/>
                        <RangeField label="Total Questions" value={config.numberOfQuestions} onChange={e => setConfig(p => ({...p, numberOfQuestions: Number(e.target.value)}))} min={5} max={30} />
                        <RangeField label="Programming Questions" value={config.numberOfProgrammingQuestions} onChange={e => setConfig(p => ({...p, numberOfProgrammingQuestions: Number(e.target.value)}))} min={0} max={config.numberOfQuestions} />
                    </div>
                )}

                {/* Step 3: Assign */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-grow"><input type="radio" name="assigneeType" checked={assignees.type === 'ALL_USERS'} onChange={() => setAssignees(p => ({...p, type: 'ALL_USERS'}))} /> All Users</label>
                            <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-grow"><input type="radio" name="assigneeType" checked={assignees.type === 'SPECIFIC_USERS'} onChange={() => setAssignees(p => ({...p, type: 'SPECIFIC_USERS'}))} /> Specific Users</label>
                        </div>
                        {assignees.type === 'SPECIFIC_USERS' && (
                            <div className="p-2 border rounded-md max-h-60 overflow-y-auto">
                                {isLoadingUsers ? <p>Loading users...</p> : allUsers.map(user => (
                                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md cursor-pointer">
                                        <input type="checkbox" checked={assignees.userIds.includes(user.id)} onChange={() => handleUserSelection(user.id)} />
                                        <img src={user.avatar} className="w-8 h-8 rounded-full" alt={user.name} />
                                        <div>
                                            <p className="text-sm font-semibold">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4">
                    <Button variant="secondary" onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1}>Back</Button>
                    {step < 3 ? (
                        <Button onClick={() => setStep(s => Math.min(3, s+1))}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Publishing..." : "Publish Assessment"}</Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><input {...props} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500" /></div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><textarea {...props} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500" /></div>
);
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => (
  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><select {...props} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">{children}</select></div>
);
const RangeField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label} ({props.value})</label><input type="range" {...props} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer" /></div>
);

export default CreateAssessmentModal;
