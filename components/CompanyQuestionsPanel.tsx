import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { UserProfile, LearningPath, LearningPathModule } from '../types';
import { generateRoleBasedRoadmap, generateModuleDetails } from '../services/geminiService';
import BookOpenIcon from './icons/BookOpenIcon';
import RouteIcon from './icons/RouteIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import { v4 as uuidv4 } from 'uuid';

interface CareerRoadmapPanelProps {
    user: UserProfile;
    onUpdateUser: (updatedUserData: Partial<UserProfile>) => Promise<void>;
}

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

const CareerRoadmapPanel: React.FC<CareerRoadmapPanelProps> = ({ user, onUpdateUser }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState<string | null>(null);

    const handleGenerateRoadmap = async () => {
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
                return {
                    ...path,
                    modules: path.modules.map(mod => {
                        if (mod.id === moduleId) {
                            return { ...mod, completed: !mod.completed };
                        }
                        return mod;
                    })
                };
            }
            return path;
        });

        if (updatedPaths) {
            await onUpdateUser({ learningPaths: updatedPaths });
        }
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
            const updatedPaths = user.learningPaths?.map(p => {
                if (p.id === pathId) {
                    return {
                        ...p,
                        modules: p.modules.map(m => m.id === module.id ? { ...m, details } : m)
                    };
                }
                return p;
            });

            if (updatedPaths) {
                await onUpdateUser({ learningPaths: updatedPaths });
            }
            setExpandedModuleId(module.id);
        } catch (err: any) {
            setError(err.message || "Could not load module details.");
        } finally {
            setIsLoadingDetails(null);
        }
    };


    return (
        <Card title="My Career Roadmap" icon={<RouteIcon />}>
            <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-gray-500 dark:text-gray-400">From <span className="font-semibold text-gray-700 dark:text-gray-300">{user.currentRole}</span> to <span className="font-semibold text-gray-700 dark:text-gray-300">{user.dreamRole}</span></p>
                        <h4 className="text-lg font-bold text-blue-600 dark:text-blue-300">Your AI-Powered Growth Plan</h4>
                    </div>
                    <Button onClick={handleGenerateRoadmap} disabled={isProcessing}>
                        {isProcessing ? 'Generating...' : 'Generate New Roadmap'}
                    </Button>
                </div>

                {error && <p className="text-center text-red-500 dark:text-red-400 py-2">{error}</p>}
                
                <div className="space-y-6">
                    {(user.learningPaths || []).length === 0 && !isProcessing ? (
                         <p className="text-center text-gray-500 py-8">No roadmaps generated yet. Click the button above to create one!</p>
                    ) : (
                        (user.learningPaths || []).map((path: LearningPath) => (
                            <div key={path.id} className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{path.title}</h3>
                                <p className="text-xs text-gray-500 mb-2">Generated on: {new Date(path.generatedAt).toLocaleDateString()}</p>
                                <p className="text-gray-600 dark:text-gray-300 italic mb-4 text-sm">{path.summary}</p>
                                <div className="space-y-2">
                                    {path.modules.map(mod => (
                                        <div key={mod.id} className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <button
                                                onClick={() => handleExpandModule(path.id, mod)}
                                                className="w-full flex items-start p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={mod.completed}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleModuleComplete(path.id, mod.id)
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-5 w-5 mt-1 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-600 cursor-pointer"
                                                />
                                                <div className="ml-4 flex-grow">
                                                    <h4 className={`font-semibold text-sm ${mod.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{mod.title}</h4>
                                                    <p className={`text-xs ${mod.completed ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{mod.description}</p>
                                                </div>
                                                <div className="ml-4 text-gray-500 dark:text-gray-400">
                                                    {expandedModuleId === mod.id ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                                                </div>
                                            </button>
                                            {expandedModuleId === mod.id && (
                                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in-up">
                                                    {isLoadingDetails === mod.id ? (
                                                        <div className="flex items-center justify-center p-8">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                            <p className="ml-4 text-gray-600 dark:text-gray-300">Generating lesson...</p>
                                                        </div>
                                                    ) : mod.details ? (
                                                        <div className="space-y-4">
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{mod.details.explanation}</p>
                                                            <div>
                                                                <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Code Example</h5>
                                                                <CodeBlock language={mod.details.codeExample.language} code={mod.details.codeExample.code} />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Real-World Analogy</h5>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 italic p-3 bg-gray-100 dark:bg-gray-900/50 border-l-4 border-yellow-400 rounded-r-md">
                                                                    {mod.details.realWorldExample}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-red-500 dark:text-red-400">Could not load details.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </Card>
    );
};

export default CareerRoadmapPanel;
