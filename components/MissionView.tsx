import React, { useState, useCallback } from 'react';
import { ProgrammingQuestion, ChallengeEvaluationResult, CodeExecutionResult } from '../types';
import { evaluateChallengeSubmission } from '../services/geminiService';
import { runMissionCode } from '../services/missionService';
import Button from './Button';
import Card from './Card';
import TrophyIcon from './icons/TrophyIcon';

interface MissionViewProps {
  question: ProgrammingQuestion;
  language: string;
  initialCode: string;
  onCodeChange: (newCode: string) => void;
  onFinish: () => void;
  onPause: () => void;
}

const ResultsScreen: React.FC<{ result: ChallengeEvaluationResult, question: ProgrammingQuestion, onFinish: () => void }> = ({ result, question, onFinish }) => {
    const passedCount = result.testCaseResults.testResults?.filter(r => r.passed).length ?? 0;
    const totalCount = question.testCases.length;
    const allPassed = passedCount === totalCount;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            <Card title="Mission Results" icon={<TrophyIcon />}>
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
                    <Button onClick={onFinish} size="lg">Back to Dashboard</Button>
                </div>
            </Card>
        </div>
    );
};


const MissionView: React.FC<MissionViewProps> = ({ question, language, initialCode, onCodeChange, onFinish, onPause }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [code, setCode] = useState(initialCode);
    const [evaluationResult, setEvaluationResult] = useState<ChallengeEvaluationResult | null>(null);
    const [runResult, setRunResult] = useState<CodeExecutionResult | null>(null);

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newCode = e.target.value;
        setCode(newCode);
        onCodeChange(newCode);
    };

    const handleRunCode = async () => {
        if (!question || isRunning) return;
        setIsRunning(true);
        setRunResult(null);
        const result = await runMissionCode(code, language, question);
        setRunResult(result);
        setIsRunning(false);
    };

    const handleSubmit = useCallback(async () => {
        if (!question || isSubmitting) return;
        setIsSubmitting(true);
        const result = await evaluateChallengeSubmission(code, language, question);
        setEvaluationResult(result);
        setIsSubmitting(false);
    }, [code, language, question, isSubmitting]);


    if (evaluationResult && question) {
        return <ResultsScreen result={evaluationResult} question={question} onFinish={onFinish} />;
    }

    if (!question) {
        return <div>Error loading question. <Button onClick={onPause}>Go Back</Button></div>;
    }

    return (
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100vh-7.5rem)] overflow-hidden bg-gray-100 dark:bg-gray-900">
            {/* Left Panel: Problem Description */}
            <div className="flex flex-col h-full max-h-full bg-white dark:bg-gray-800 rounded-lg p-4 overflow-y-auto">
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-300">{question.questionText}</h2>
                    </div>
                    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300 space-y-4">
                        <p>{question.description}</p>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Constraints:</h4>
                            <ul className="list-disc pl-5">
                                {question.constraints.map(c => <li key={c}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
                 <div className="mt-auto pt-4">
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Visible Test Cases</h4>
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
                    onChange={handleCodeChange}
                    placeholder="Enter your code here..."
                />

                {runResult && (
                    <div className="mt-4 p-3 rounded-lg border bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Run Results (Visible Test Cases)</h4>
                        {runResult.error ? (
                            <pre className="text-red-600 dark:text-red-300 whitespace-pre-wrap text-xs">Error: {runResult.error}</pre>
                        ) : (
                            <div className="space-y-1">
                                {runResult.testResults?.map((res, i) => (
                                    <div key={i} className={`text-xs flex items-center gap-2 ${res.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        <span>{res.passed ? '✓' : '✗'}</span>
                                        <span className="font-mono">Test {i + 1}: Input `{res.input.replace(/\n/g, "\\n")}`</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                    <Button variant="secondary" onClick={onPause}>Back to Dashboard</Button>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={handleRunCode} disabled={isRunning || isSubmitting}>
                            {isRunning ? 'Running...' : 'Run Code'}
                        </Button>
                        <Button onClick={handleSubmit} size="lg" disabled={isSubmitting || isRunning}>
                            {isSubmitting ? 'Evaluating...' : 'Submit Final Code'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissionView;