import React, { useState, useEffect } from 'react';
import { StoredAssessmentResult, UserProfile, DetailedEvaluationResult, AssessmentConfig, QuizConfig } from '../types';
import { getAssessmentResult } from '../services/assessmentService';
import { getConceptExplanation } from '../services/geminiService';
import Card from './Card';
import Button from './Button';
import LineChart from './charts/LineChart';
import TrophyIcon from './icons/TrophyIcon';
import CodeBlock from './CodeBlock';

interface AssessmentResultViewProps {
    resultId: string;
    user: UserProfile;
    onBack: () => void;
}

const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({ resultId, user, onBack }) => {
    const [storedResult, setStoredResult] = useState<StoredAssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clarifiedConcepts, setClarifiedConcepts] = useState<Record<number, string>>({});
    const [isClarifying, setIsClarifying] = useState<number | null>(null);

    useEffect(() => {
        setIsLoading(true);
        getAssessmentResult(resultId)
            .then(res => {
                if (res) {
                    setStoredResult(res);
                } else {
                    setError("Assessment result not found.");
                }
            })
            .catch(err => {
                console.error(err);
                setError("Failed to load assessment result.");
            })
            .finally(() => setIsLoading(false));
    }, [resultId]);

    const handleGetClarified = async (questionIndex: number, questionText: string) => {
        if (isClarifying !== null || clarifiedConcepts[questionIndex]) return;
        setIsClarifying(questionIndex);
        const explanation = await getConceptExplanation(questionText);
        setClarifiedConcepts(prev => ({ ...prev, [questionIndex]: explanation }));
        setIsClarifying(null);
    };

    const assessmentTitle = React.useMemo(() => {
        if (!storedResult) return 'Assessment Result';
        const { config } = storedResult;
        const { language, difficulty } = config;
        if (config.type === 'assessment' && (config as AssessmentConfig).customTopic) {
            return `${language} - ${(config as AssessmentConfig).customTopic} (${difficulty})`;
        }
        return `${config.type === 'assessment' ? 'Assessment' : 'Quiz'}: ${language} (${difficulty})`;
    }, [storedResult]);

    const performanceData = React.useMemo(() => {
        if (!storedResult) return [];
        const allActivity = user.activity || [];
        return allActivity
            .filter(item => item.type === 'assessment' || item.type === 'quiz')
            .map(item => ({
                label: `${item.language.substring(0, 4)} (${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
                value: item.score || 0
            }));
    }, [storedResult, user.activity]);

    const renderCriterion = (name: string, data: { score: number; feedback: string; }) => (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-baseline">
                <h5 className="font-semibold text-gray-800 dark:text-gray-200">{name}</h5>
                <span className="font-bold text-lg text-blue-500 dark:text-blue-400">{data.score} / 5</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{data.feedback}</p>
        </div>
    );

    if (isLoading) return <div className="text-center p-12">Loading result...</div>;
    if (error) return <div className="text-center p-12 text-red-500">{error}</div>;
    if (!storedResult) return <div className="text-center p-12">Result not found.</div>;

    const { result, config } = storedResult;

    return (
        <div className="space-y-6 animate-fade-in">
            <Button onClick={onBack} variant="secondary">← Back to History</Button>
            <Card title={`Result: ${result.score}%`} icon={<TrophyIcon />}>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Overall Feedback for {assessmentTitle}:</h3>
                    <p className="text-gray-600 dark:text-gray-300 italic">"{result.feedback}"</p>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Detailed Breakdown:</h3>
                        {result.detailedResults.map((res: DetailedEvaluationResult, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${res.isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{index + 1}. {res.questionText}</p>
                                <p className={`mt-1 text-sm ${res.isCorrect ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                                    Your answer: {res.userAnswer} {res.isCorrect ? <span className="font-bold">(Correct)</span> : <span className="font-bold">(Incorrect)</span>}
                                </p>
                                
                                {!res.isCorrect && res.correctAnswerText && (
                                    <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                                        Correct answer: <span className="font-semibold">{res.correctAnswerText}</span>
                                    </p>
                                )}
                                
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{res.explanation}</p>
                                
                                {res.correctCodeSolution && (
                                    <div className="mt-4">
                                        <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Model Solution</h5>
                                        <CodeBlock language={config.language} code={res.correctCodeSolution} />
                                    </div>
                                )}

                                {res.programmingEvaluation && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-4">
                                        <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/40 rounded-md border border-blue-200 dark:border-blue-700">
                                            <p className="font-semibold text-lg text-blue-700 dark:text-blue-300">{res.programmingEvaluation.overallFeedback}</p>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{res.programmingEvaluation.totalScore} / 25</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {renderCriterion("Correctness & Edge Cases", res.programmingEvaluation.correctness)}
                                            {renderCriterion("Time Complexity (Big O)", res.programmingEvaluation.timeComplexity)}
                                            {renderCriterion("Data Structures", res.programmingEvaluation.dataStructures)}
                                            {renderCriterion("Space Complexity", res.programmingEvaluation.spaceComplexity)}
                                            {renderCriterion("Logic & Simplicity", res.programmingEvaluation.logicSimplicity)}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-4">
                                    <Button size="sm" variant="secondary" onClick={() => handleGetClarified(index, res.questionText)} disabled={isClarifying === index}>
                                        {isClarifying === index ? 'Clarifying...' : 'Get Clarified'}
                                    </Button>
                                </div>
                                {clarifiedConcepts[index] && (
                                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 border-l-4 border-blue-400 text-sm text-gray-700 dark:text-gray-300 animate-fade-in">
                                        <p className="whitespace-pre-line">{clarifiedConcepts[index]}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <LineChart data={performanceData} color="#3b82f6" title="Your Performance Trend" />
                </div>
            </Card>
        </div>
    );
};

export default AssessmentResultView;
