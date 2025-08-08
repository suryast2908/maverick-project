import React, { useState, useEffect, useCallback } from 'react';
import { ChallengeQuestion, ChallengeEvaluationResult, QuestionType } from '../types';
import { generateChallengeQuestion, evaluateChallengeSubmission } from '../services/geminiService';
import Button from './Button';
import Card from './Card';
import TrophyIcon from './icons/TrophyIcon';

interface ChallengeViewProps {
  language: string;
  onComplete: () => void;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

const LoadingScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-8 text-3xl font-bold text-gray-800 dark:text-gray-200 tracking-wider">Generating Your Challenge...</p>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Get ready to show your skills!</p>
    </div>
);

const ResultsScreen: React.FC<{ result: ChallengeEvaluationResult, question: ChallengeQuestion, onComplete: () => void }> = ({ result, question, onComplete }) => {
    const passedCount = result.testCaseResults.testResults?.filter(r => r.passed).length ?? 0;
    const totalCount = question.testCases.length;
    const allPassed = passedCount === totalCount;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            <Card title="Challenge Results" icon={<TrophyIcon />}>
                <div className="text-center mb-6">
                    <h2 className={`text-3xl font-bold ${allPassed ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {passedCount} / {totalCount} Test Cases Passed
                    </h2>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-gray-200 dark:border-gray-700 pb-2">AI Feedback on Your Logic</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-blue-500 dark:border-blue-400 rounded-r-lg">
                        <p className="text-gray-800 dark:text-gray-200 italic">"{result.logicalThinkingAnalysis}"</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 border-b-2 border-gray-200 dark:border-gray-700 pb-2">Detailed Test Case Results</h3>
                    <div className="space-y-2">
                        {result.testCaseResults.testResults?.map((tc, i) => (
                            <div key={i} className={`p-3 rounded-md text-sm flex items-center gap-4 ${tc.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                <span className={`font-bold text-lg ${tc.passed ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                    {tc.passed ? '✓' : '✗'}
                                </span>
                                <div className="flex-grow">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">Test Case {i + 1} {question.testCases[i].hidden ? '(Hidden)' : ''}</span>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">Input: {tc.input.replace(/\n/g, "\\n")}</div>
                                </div>
                                <span className={`font-semibold py-1 px-2.5 rounded-full text-xs ${tc.passed ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                                    {tc.passed ? 'Passed' : 'Failed'}
                                </span>
                            </div>
                        ))}
                         {result.testCaseResults.error && (
                             <div className="p-3 rounded-md bg-red-500/10 text-red-500 dark:text-red-300 font-mono text-sm">
                                <strong>Error:</strong> {result.testCaseResults.error}
                            </div>
                         )}
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <Button onClick={onComplete} size="lg">Back to Dashboard</Button>
                </div>
            </Card>
        </div>
    );
};


const ChallengeView: React.FC<ChallengeViewProps> = ({ language, onComplete }) => {
    const [question, setQuestion] = useState<ChallengeQuestion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes
    const [code, setCode] = useState('');
    const [evaluationResult, setEvaluationResult] = useState<ChallengeEvaluationResult | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!question || isSubmitting) return;
        setIsSubmitting(true);
        const result = await evaluateChallengeSubmission(code, language, question);
        setEvaluationResult(result);
        setIsSubmitting(false);
    }, [code, language, question, isSubmitting]);

    // Fetch question on mount
    useEffect(() => {
        generateChallengeQuestion(language).then(q => {
            setQuestion(q);
            setCode(q.starterCode);
            setIsLoading(false);
        });
    }, [language]);

    // Timer logic
    useEffect(() => {
        if (isLoading || isSubmitting || evaluationResult) return;
        
        if (timeRemaining <= 0) {
            handleSubmit();
            return;
        }

        const timerId = setInterval(() => {
            setTimeRemaining(t => t - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeRemaining, isLoading, isSubmitting, evaluationResult, handleSubmit]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (evaluationResult && question) {
        return <ResultsScreen result={evaluationResult} question={question} onComplete={onComplete} />;
    }

    if (!question) {
        return <div>Error loading question. <Button onClick={onComplete}>Go Back</Button></div>;
    }

    return (
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-7.5rem)] overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Left Panel: Problem Description */}
            <div className="flex flex-col h-full max-h-full bg-white dark:bg-gray-800 rounded-lg p-4 overflow-y-auto">
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-300">{question.questionText}</h2>
                        <div className={`text-2xl font-bold font-mono px-4 py-2 rounded-lg ${timeRemaining < 60 ? 'text-red-500 bg-red-500/20 animate-pulse' : 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700'}`}>
                            {formatTime(timeRemaining)}
                        </div>
                    </div>
                    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300 space-y-4">
                        <p>{question.description}</p>
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Constraints:</h4>
                            <ul className="list-disc pl-5">
                                {question.constraints.map(c => <li key={c}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                 <div className="mt-auto pt-4">
                    <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Visible Test Cases</h4>
                    <div className="space-y-2">
                        {question.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                            <div key={i} className="bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md text-xs font-mono">
                                <p><span className="font-semibold text-gray-500 dark:text-gray-400">Input:</span> <code className="text-yellow-700 dark:text-yellow-300">{tc.input.replace(/\n/g, "\\n")}</code></p>
                                <p><span className="font-semibold text-gray-500 dark:text-gray-400">Expected:</span> <code className="text-yellow-700 dark:text-yellow-300">{tc.expectedOutput.replace(/\n/g, "\\n")}</code></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Code Editor and Submission */}
            <div className="flex flex-col h-full max-h-full bg-white dark:bg-gray-800 rounded-lg p-4">
                <label htmlFor="code-editor" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language} Code Editor</label>
                <textarea
                    id="code-editor"
                    className="flex-grow w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your code here..."
                />
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleSubmit} size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Evaluating...' : 'Submit Final Code'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeView;