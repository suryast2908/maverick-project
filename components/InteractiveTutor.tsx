import React, { useState, useEffect, useCallback } from 'react';
import { TutorPace, TutorContent } from '../types';
import { generateTutorContent } from '../services/geminiService';
import Button from './Button';

interface InteractiveTutorProps {
    topic: string;
    pace: TutorPace;
    onExit: (nextTopic?: string) => void;
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

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </div>
);

const InteractiveTutor: React.FC<InteractiveTutorProps> = ({ topic, pace, onExit }) => {
    const [history, setHistory] = useState<TutorContent[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [nextTopic, setNextTopic] = useState<string | undefined>(undefined);

    const fetchLessonPart = useCallback(async (currentHistory: TutorContent[]) => {
        setIsLoading(true);
        const newContent = await generateTutorContent(topic, pace, currentHistory);
        setHistory(prev => [...prev, newContent]);
        setCurrentIndex(currentHistory.length);
        if (newContent.isFinished) {
            setIsFinished(true);
            setNextTopic(newContent.nextTopicSuggestion);
        }
        setIsLoading(false);
    }, [topic, pace]);

    useEffect(() => {
        fetchLessonPart([]);
    }, [fetchLessonPart]);

    const handleNext = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (!isLoading && !isFinished) {
            fetchLessonPart(history);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };
    
    const handleStartNewLesson = () => {
        onExit(nextTopic);
    }
    
    const handleEndSession = () => {
        onExit();
    }
    
    const currentContent = history[currentIndex];

    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg min-h-[400px] flex flex-col animate-fade-in">
            <div className="flex-grow">
                {isLoading && history.length === 0 ? <LoadingSkeleton /> : null}

                {currentContent && (
                    <div className="animate-fade-in-up">
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-300 mb-4">{currentContent.subTopicTitle}</h3>
                        
                        <div className="prose dark:prose-invert prose-lg max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{currentContent.explanation}</p>
                        </div>
                        
                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">Code Example</h4>
                            <CodeBlock language={currentContent.codeExample.language} code={currentContent.codeExample.code} />
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-2">Real-World Example</h4>
                            <div className="p-4 bg-gray-100 dark:bg-gray-700/30 border-l-4 border-yellow-500 dark:border-yellow-400 text-gray-700 dark:text-gray-300 italic">
                                {currentContent.realWorldExample}
                            </div>
                        </div>
                    </div>
                )}
                
                {isLoading && history.length > 0 && <div className="mt-4"><LoadingSkeleton /></div>}

                {isFinished && currentIndex === history.length - 1 && (
                    <div className="mt-8 text-center p-6 bg-green-500/10 border border-green-500/30 rounded-lg animate-fade-in-up">
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-300">Congratulations!</h3>
                        <p className="text-gray-800 dark:text-gray-200 mt-2">You've completed the topic: <span className="font-semibold">{topic}</span>.</p>
                        {nextTopic && (
                            <p className="text-gray-700 dark:text-gray-300 mt-4">Ready for the next step? We suggest learning about: <span className="font-semibold text-blue-600 dark:text-blue-300">{nextTopic}</span></p>
                        )}
                        <div className="flex justify-center space-x-4 mt-6">
                            <Button variant="secondary" onClick={handleEndSession}>Finish Session</Button>
                            {nextTopic && <Button onClick={handleStartNewLesson}>Learn: {nextTopic}</Button>}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Button onClick={handlePrevious} disabled={currentIndex === 0 || isLoading}>Previous</Button>
                <div className="text-sm text-gray-500 dark:text-gray-400">{currentIndex + 1} / {history.length}{isLoading ? '+' : ''}</div>
                <Button onClick={handleNext} disabled={isLoading || (isFinished && currentIndex === history.length - 1)}>
                    {isLoading && currentIndex === history.length-1 ? 'Generating...' : 'Next'}
                </Button>
            </div>
             <Button variant="secondary" size="sm" className="w-full mt-4" onClick={handleEndSession}>Exit Tutor</Button>
        </div>
    );
};

export default InteractiveTutor;