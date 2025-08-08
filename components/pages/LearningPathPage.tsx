
import React, { useState } from 'react';
import { UserProfile, LearningPath, LearningPathModule, TutorPace } from '../../types';
import { createAndSaveLearningPath } from '../../services/learningService';
import { generateModuleDetails, generateRoleBasedRoadmap } from '../../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

import Button from '../Button';
import Card from '../Card';
import InteractiveTutor from '../InteractiveTutor';
import RouteIcon from '../icons/RouteIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import CodeIcon from '../icons/CodeIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import ChevronUpIcon from '../icons/ChevronUpIcon';

interface LearningPathPageProps {
    user: UserProfile;
    onUpdateUser: (updatedUserData: Partial<UserProfile>) => Promise<void>;
}

type LearningPathView = 'my_paths' | 'generate' | 'tutor';

const CodeBlock: React.FC<{ language: string; code: string; }> = ({ language, code }) => (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 my-4">
        <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 font-semibold flex justify-between items-center">
            <span>{language}</span>
            <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-xs"
                aria-label="Copy code"
            >
                Copy
            </button>
        </div>
        <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
            <code className={`language-${language}`}>{code}</code>
        </pre>
    </div>
);

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL", "HTML/CSS", "Solidity"
];

const LearningPathPage: React.FC<LearningPathPageProps> = ({ user, onUpdateUser }) => {
    const [view, setView] = useState<LearningPathView>('my_paths');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // For "My Paths" tab
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState<string | null>(null);
    
    // For Tutor tabs
    const [tutorSession, setTutorSession] = useState<{ topic: string; pace: TutorPace } | null>(null);
    const [language, setLanguage] = useState('JavaScript');
    const [topic, setTopic] = useState('');
    const [pace, setPace] = useState<TutorPace>('Intermediate');

    const handleGenerateFromResume = async () => {
        setError(null);
        setIsProcessing(true);
        try {
            const newPath = await createAndSaveLearningPath(user);
            const updatedPaths = [...(user.learningPaths || []), newPath];
            await onUpdateUser({ learningPaths: updatedPaths });
            setView('my_paths');
        } catch (err: any) {
            console.error("Failed to generate learning path:", err);
            setError(err.message || "An unknown error occurred while generating the path.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateFromRoles = async () => {
        if (!user.currentRole || !user.dreamRole || user.currentRole === 'Not specified' || user.dreamRole === 'Not specified') {
            setError("Please set your current and desired roles in your profile to generate a roadmap.");
            return;
        }
        setError(null);
        setIsProcessing(true);
        try {
            const generatedContent = await generateRoleBasedRoadmap(user.currentRole, user.dreamRole, user.skills);
            const newRoadmap: LearningPath = {
                id: uuidv4(),
                generatedAt: new Date().toISOString(),
                title: generatedContent.title,
                summary: generatedContent.summary,
                modules: generatedContent.modules.map(mod => ({
                    ...mod,
                    id: uuidv4(),
                    completed: false
                }))
            };
            const updatedPaths = [...(user.learningPaths || []), newRoadmap];
            await onUpdateUser({ learningPaths: updatedPaths });
            setView('my_paths');
        } catch (err: any) {
            console.error("Failed to generate career roadmap:", err);
            setError(err.message || "An unknown error occurred while generating the roadmap.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleModuleComplete = async (pathId: string, moduleId: string) => {
        const updatedPaths = user.learningPaths?.map(path => {
            if (path.id === pathId) {
                return { ...path, modules: path.modules.map(mod => mod.id === moduleId ? { ...mod, completed: !mod.completed } : mod) };
            }
            return path;
        });
        if (updatedPaths) await onUpdateUser({ learningPaths: updatedPaths });
    };

    const handleExpandModule = async (pathId: string, module: LearningPathModule) => {
        if (expandedModuleId === module.id) {
            setExpandedModuleId(null);
            return;
        }
        if (module.details) {
            setExpandedModuleId(module.id);
            return;
        }
        setIsLoadingDetails(module.id);
        setError(null);
        try {
            const details = await generateModuleDetails(module.title, module.description);
            const updatedPaths = user.learningPaths?.map(p => 
                p.id === pathId ? { ...p, modules: p.modules.map(m => m.id === module.id ? { ...m, details } : m) } : p
            );
            if (updatedPaths) await onUpdateUser({ learningPaths: updatedPaths });
            setExpandedModuleId(module.id);
        } catch (err: any) {
            setError(err.message || "Could not load module details.");
        } finally {
            setIsLoadingDetails(null);
        }
    };

    const handleStartTutor = (moduleTitle: string) => setTutorSession({ topic: moduleTitle, pace: 'Intermediate' });
    const handleExitTutor = (nextTopic?: string) => {
        setTutorSession(null);
        if (nextTopic) {
            setTopic(nextTopic);
            setView('tutor');
        }
    };

    const renderMyPaths = () => {
        if (tutorSession) {
            return (
                <Card title="Interactive Tutor" icon={<CodeIcon />}>
                    <InteractiveTutor topic={tutorSession.topic} pace={tutorSession.pace} onExit={handleExitTutor} />
                </Card>
            );
        }

        return (
            <Card title="My Learning Paths" icon={<ClipboardListIcon />}>
                <div className="space-y-6">
                    {(user.learningPaths || []).length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No learning paths generated yet. Go to the "Generate Path" tab to create one.</p>
                    ) : (
                        (user.learningPaths || []).map(path => (
                            <div key={path.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{path.title}</h3>
                                <p className="text-xs text-gray-500 mb-2">Generated on: {new Date(path.generatedAt).toLocaleDateString()}</p>
                                <p className="text-gray-600 dark:text-gray-300 italic mb-4 text-sm">{path.summary}</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        {/* Table Head */}
                                        <thead className="bg-gray-100 dark:bg-gray-800">
                                            <tr>
                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12"></th>
                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Module Name</th>
                                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estimated Time</th>
                                                <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        {/* Table Body */}
                                        <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                                            {path.modules.map(mod => (
                                                <React.Fragment key={mod.id}>
                                                    <tr onClick={() => handleExpandModule(path.id, mod)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                                        <td className="px-4 py-3"><input type="checkbox" checked={mod.completed} onChange={e => { e.stopPropagation(); handleToggleModuleComplete(path.id, mod.id); }} onClick={e => e.stopPropagation()} className="h-5 w-5 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-600 cursor-pointer" /></td>
                                                        <td className="px-4 py-3"><div className="text-sm font-medium text-gray-900 dark:text-gray-100">{mod.title}</div><div className="text-xs text-gray-500 dark:text-gray-400">{mod.description}</div></td>
                                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{mod.estimatedTime}</td>
                                                        <td className="px-4 py-3 text-center">{expandedModuleId === mod.id ? <ChevronUpIcon className="h-5 w-5 mx-auto" /> : <ChevronDownIcon className="h-5 w-5 mx-auto" />}</td>
                                                    </tr>
                                                    {expandedModuleId === mod.id && (
                                                        <tr>
                                                            <td colSpan={4} className="p-4 bg-gray-100 dark:bg-gray-900 animate-fade-in">
                                                                {isLoadingDetails === mod.id ? <div className="text-center p-4">Loading details...</div> : mod.details ? (
                                                                    <div className="space-y-4">
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{mod.details.explanation}</p>
                                                                        <div><h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Code Example</h5><CodeBlock language={mod.details.codeExample.language} code={mod.details.codeExample.code} /></div>
                                                                        <div><h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Real-World Analogy</h5><p className="text-sm text-gray-700 dark:text-gray-300 italic p-3 bg-gray-200 dark:bg-gray-800 border-l-4 border-yellow-400 rounded-r-md">{mod.details.realWorldExample}</p></div>
                                                                        <div className="flex justify-end pt-2"><Button onClick={() => handleStartTutor(mod.title)}>Start Learning Session</Button></div>
                                                                    </div>
                                                                ) : <p className="text-center text-red-500">Could not load details.</p>}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        );
    };

    const renderGenerate = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Generate from Resume" icon={<RouteIcon />}>
                <div className="text-center p-8 space-y-4 flex flex-col items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">
                        {user.resumeUrl ? "We'll analyze your resume and skills to create a personalized learning path." : "Please upload a resume on your profile page to enable this feature."}
                    </p>
                    <Button onClick={handleGenerateFromResume} disabled={isProcessing || !user.resumeUrl}>
                        {isProcessing ? 'Generating...' : 'Analyze Resume'}
                    </Button>
                </div>
            </Card>
            <Card title="Generate from Career Goals" icon={<RouteIcon />}>
                <div className="text-center p-8 space-y-4 flex flex-col items-center justify-center h-full">
                     <p className="text-gray-500 dark:text-gray-400">
                        Define your career trajectory from '{user.currentRole}' to '{user.dreamRole}' and we'll map out the skills you need.
                    </p>
                    <Button onClick={handleGenerateFromRoles} disabled={isProcessing}>
                        {isProcessing ? 'Generating...' : 'Map My Career'}
                    </Button>
                </div>
            </Card>
            {error && <p className="md:col-span-2 text-center text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
    
    const renderTutor = () => {
        if (tutorSession) {
            return (
                <Card title="Interactive Tutor" icon={<CodeIcon />}>
                    <InteractiveTutor topic={tutorSession.topic} pace={tutorSession.pace} onExit={handleExitTutor} />
                </Card>
            );
        }
        return (
            <Card title="Interactive Tutor" icon={<CodeIcon />}>
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a language and enter a topic you want to learn about. Our AI Tutor will generate a personalized lesson for you.</p>
                    <div><label htmlFor="lp-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Programming Language</label><select id="lp-language" name="language" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500" value={language} onChange={(e) => setLanguage(e.target.value)}>{programmingLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}</select></div>
                    <div><label htmlFor="lp-topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What do you want to learn?</label><input id="lp-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'React Hooks', 'Async/Await', 'CSS Flexbox'" className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500" /></div>
                    <div><h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Pace</h4><div className="flex space-x-2">{(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (<button key={level} type="button" className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${pace === level ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'}`} onClick={() => setPace(level)}>{level}</button>))}</div></div>
                    <div className="flex justify-end pt-2"><Button onClick={() => handleStartTutor(topic)} disabled={!topic.trim()}>Start Learning</Button></div>
                </div>
            </Card>
        );
    };

    const tabs = [
        { id: 'my_paths', name: 'My Paths', icon: <ClipboardListIcon className="h-5 w-5" /> },
        { id: 'generate', name: 'Generate Path', icon: <RouteIcon className="h-5 w-5" /> },
        { id: 'tutor', name: 'Interactive Tutor', icon: <CodeIcon className="h-5 w-5" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setView(tab.id as LearningPathView)} className={`flex items-center gap-2 px-4 py-3 -mb-px font-semibold text-sm transition-colors ${view === tab.id ? 'border-b-2 border-blue-500 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>
                        {tab.icon} {tab.name}
                    </button>
                ))}
            </div>
            <div className="animate-fade-in">
                {view === 'my_paths' && renderMyPaths()}
                {view === 'generate' && renderGenerate()}
                {view === 'tutor' && renderTutor()}
            </div>
        </div>
    );
};

export default LearningPathPage;
