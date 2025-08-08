

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { HackathonRequest, ProblemStatement } from '../types';
import { createHackathon } from '../services/hackathonService';
import { v4 as uuidv4 } from 'uuid';
import TrashIcon from './icons/TrashIcon';

interface CreateHackathonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHackathonCreated: (hackathonId: string) => void;
    requestToApprove?: HackathonRequest | null;
}

const CreateHackathonModal: React.FC<CreateHackathonModalProps> = ({ isOpen, onClose, onHackathonCreated, requestToApprove }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [rules, setRules] = useState('');
    const [prizes, setPrizes] = useState('');
    const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            if (requestToApprove) {
                setTitle(`Hackathon for: ${requestToApprove.requestText.substring(0, 30)}...`);
                setDescription(requestToApprove.requestText);
            } else {
                // Reset form for a new hackathon
                setTitle('');
                setDescription('');
                setBannerUrl('https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2006&auto=format&fit=crop');
                setLogoUrl('');
                setRules('• Teams of 1-4 members.\n• All code must be fresh.');
                setPrizes('• 1st Place: $1000\n• 2nd Place: Swag');
                setProblemStatements([]);
            }
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setStartDate(now.toISOString().slice(0, 16));
            const end = new Date(now);
            end.setDate(now.getDate() + 2);
            setEndDate(end.toISOString().slice(0, 16));
        }
    }, [requestToApprove, isOpen]);

    const handleAddProblem = () => {
        setProblemStatements(prev => [...prev, { id: uuidv4(), title: '', description: '', difficulty: 'Medium', tags: [] }]);
    };

    const handleProblemChange = (id: string, field: keyof ProblemStatement, value: any) => {
        setProblemStatements(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };
    
    const handleRemoveProblem = (id: string) => {
        setProblemStatements(prev => prev.filter(p => p.id !== id));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim() || !startDate || !endDate) {
            alert("Title, description, and dates are required.");
            return;
        }
        setIsSubmitting(true);
        try {
            const hackathonData = {
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                bannerUrl,
                logoUrl,
                rules: rules.split('\n').filter(r => r.trim() !== ''),
                prizes: prizes.split('\n').filter(p => p.trim() !== ''),
                problemStatements,
            };
            const hackathonId = await createHackathon(hackathonData);
            onHackathonCreated(hackathonId);
            onClose();
        } catch (error) {
            console.error("Failed to create hackathon:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalTitle = requestToApprove ? "Approve & Create Hackathon" : "Create New Hackathon";

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="2xl">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
                    <InputField label="Banner Image URL" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
                    <InputField label="Start Date & Time" type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    <InputField label="End Date & Time" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
                <TextAreaField label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextAreaField label="Rules (one per line)" value={rules} onChange={e => setRules(e.target.value)} rows={4} />
                    <TextAreaField label="Prizes (one per line)" value={prizes} onChange={e => setPrizes(e.target.value)} rows={4} />
                </div>
                
                {/* Problem Statements */}
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Problem Statements</h4>
                    <div className="space-y-3">
                        {problemStatements.map(ps => (
                            <div key={ps.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 relative">
                                <button onClick={() => handleRemoveProblem(ps.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon /></button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <InputField label="Problem Title" value={ps.title} onChange={e => handleProblemChange(ps.id, 'title', e.target.value)} />
                                    <SelectField label="Difficulty" value={ps.difficulty} onChange={e => handleProblemChange(ps.id, 'difficulty', e.target.value)}>
                                        <option>Easy</option><option>Medium</option><option>Hard</option>
                                    </SelectField>
                                </div>
                                <TextAreaField label="Description" value={ps.description} onChange={e => handleProblemChange(ps.id, 'description', e.target.value)} rows={2} />
                                <InputField label="Tags (comma separated)" value={ps.tags.join(',')} onChange={e => handleProblemChange(ps.id, 'tags', e.target.value.split(',').map(t => t.trim()))} />
                            </div>
                        ))}
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleAddProblem} className="mt-3">Add Problem Statement</Button>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Hackathon"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};


const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <textarea {...props} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <select {...props} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500">{children}</select>
  </div>
);


export default CreateHackathonModal;