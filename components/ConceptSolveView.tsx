import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConceptQuestion, CodeExecutionResult, UserProfile, ConceptAttempt } from '../types';
import { getQuestionForConcept, runConceptCode, submitConceptAttempt } from '../services/conceptService';
import Button from './Button';

interface ConceptSolveViewProps {
  conceptSlug: string;
  user: UserProfile;
  onUpdateUser: (updatedUserData: Partial<UserProfile>) => Promise<void>;
  onExit: () => void;
  onSolveNew: (conceptSlug: string) => void;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const LoadingScreen: React.FC<{ conceptSlug: string }> = ({ conceptSlug }) => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-6 text-2xl text-gray-700 dark:text-gray-300">Loading Concept: {conceptSlug}...</p>
    </div>
);

const ResultPill: React.FC<{ passed: boolean }> = ({ passed }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${passed ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'}`}>
    {passed ? 'Passed' : 'Failed'}
  </span>
);


const programmingLanguages = ["javascript", "python", "java", "csharp", "cpp", "rust", "go"];

const ConceptSolveView: React.FC<ConceptSolveViewProps> = ({ conceptSlug, user, onUpdateUser, onExit, onSolveNew }) => {
  const [question, setQuestion] = useState<ConceptQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const [time, setTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<CodeExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase');
  
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };
  
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getQuestionForConcept(conceptSlug)
      .then(q => {
        setQuestion(q);
        setCode(''); 
        setTime(0);
        setRunResult(null);
        setActiveTab('testcase');
        startTimer();
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load concept question.");
      })
      .finally(() => setIsLoading(false));

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [conceptSlug]);

  const handleRunCode = async () => {
    if (!question || isRunning) return;
    setIsRunning(true);
    setRunResult(null);
    setActiveTab('result');
    try {
        const result = await runConceptCode(code, language, question.testCases);
        setRunResult(result);
    } catch (e: any) {
        setRunResult({ success: false, error: e.message || 'Failed to run code.', testResults: [] });
    } finally {
        setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!question || isSubmitting) return;
    setIsSubmitting(true);
    setActiveTab('result');
    try {
        const result = await runConceptCode(code, language, question.testCases);
        setRunResult(result);

        const attempt: Omit<ConceptAttempt, 'id' | 'timestamp'> = {
            userId: user.id,
            conceptId: question.id,
            timeTaken: time,
            solved: result.success,
            code: code,
        };
        await submitConceptAttempt(attempt);

        if (result.success) {
            await onUpdateUser({ questionsSolved: (user.questionsSolved || 0) + 1 });
            alert('Congratulations! All test cases passed. Problem solved!');
        } else {
            alert(`Submission complete. You failed one or more test cases.`);
        }
        
        onExit();

    } catch (e: any) {
        alert(`An error occurred during submission: ${e.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingScreen conceptSlug={conceptSlug} />;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!question) return <div className="text-center p-8">Question not found.</div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7.5rem)] gap-4">
      {/* Left Panel: Problem */}
      <div className="lg:w-5/12 bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-700/50 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{question.title}</h2>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{question.difficulty}</span>
                <span className="ml-4 text-sm text-gray-500">Acceptance: {question.acceptanceRate}</span>
            </div>
            <div className="font-mono text-lg font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">{formatTime(time)}</div>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none overflow-y-auto flex-grow pr-2 custom-scrollbar">
            <p className="whitespace-pre-line">{question.questionText}</p>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm mb-2">Topics:</h4>
            <div className="flex flex-wrap gap-2">
                {question.topics.map(topic => (
                    <span key={topic} className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded">{topic}</span>
                ))}
            </div>
             <h4 className="font-semibold text-sm mt-4 mb-2">Similar Questions:</h4>
            <div className="flex flex-wrap gap-2">
                {question.similarQuestions.map(simQ => (
                    <button key={simQ} onClick={() => onSolveNew(simQ.toLowerCase().replace(/\s+/g, '-'))} className="text-blue-500 hover:underline text-xs">{simQ}</button>
                ))}
            </div>
        </div>
      </div>
      
      {/* Right Panel: Editor & Console */}
      <div className="lg:w-7/12 flex flex-col gap-4">
        <div className="flex-grow flex flex-col bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-[#161b22]">
            <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500">
                 {programmingLanguages.map(lang => <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>)}
            </select>
          </div>
          <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full flex-grow bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 p-4 font-mono text-sm resize-none focus:outline-none custom-scrollbar"
              placeholder={`// Write your ${language} code here...`}
          />
        </div>
        <div className="h-48 flex flex-col bg-white dark:bg-[#161b22] rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
            {/* Console Tabs */}
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700/50">
                <button onClick={() => setActiveTab('testcase')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'testcase' ? 'text-gray-900 dark:text-white border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0d1117]'}`}>
                    Test Cases
                </button>
                <button onClick={() => setActiveTab('result')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'result' ? 'text-gray-900 dark:text-white border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#0d1117]'}`}>
                    Result
                </button>
            </div>
            {/* Console Content */}
            <div className="p-3 flex-grow overflow-auto custom-scrollbar bg-gray-50 dark:bg-[#0d1117]">
                {activeTab === 'testcase' && (
                     <div className="space-y-2">
                        {question.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                            <div key={i}>
                                <p className="font-semibold text-xs text-gray-600 dark:text-gray-400">Case {i + 1}</p>
                                <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                    <p><span className="font-semibold">Input:</span> {tc.input}</p>
                                    <p><span className="font-semibold">Expected:</span> {tc.expectedOutput}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'result' && (
                    <pre className="text-xs font-mono">
                        {isRunning && <p>Running test cases...</p>}
                        {isSubmitting && <p>Submitting and running all test cases...</p>}
                        {runResult?.error && <p className="text-red-400 whitespace-pre-wrap">Error: {runResult.error}</p>}
                        {runResult?.testResults && (
                            <div className="space-y-2">
                                {runResult.testResults.map((res, i) => (
                                     <div key={i} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-900 rounded">
                                        <p className={`font-semibold ${res.passed ? 'text-green-500' : 'text-red-500'}`}>Test Case {i+1}</p>
                                        <ResultPill passed={res.passed} />
                                     </div>
                                ))}
                            </div>
                        )}
                    </pre>
                )}
            </div>
        </div>
        <div className="flex justify-between items-center flex-shrink-0 mt-auto">
            <Button variant="secondary" onClick={onExit}>Back to List</Button>
            <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handleRunCode} disabled={isRunning || isSubmitting}>Run Code</Button>
                <Button onClick={handleSubmit} disabled={isRunning || isSubmitting}>Submit Solution</Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConceptSolveView;