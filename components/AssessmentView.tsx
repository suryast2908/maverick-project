import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AssessmentQuestion, UserAnswer, EvaluationResult, AssessmentConfig, QuizConfig, QuestionType, ProgrammingQuestion, CodeExecutionResult, UserActivity, DetailedEvaluationResult, ProgrammingEvaluationCriteria, MCQQuestion } from '../types';
import { generateAssessmentQuestions, evaluateAssessment, generateDynamicQuiz, evaluateCodeAgainstTestCases, getConceptExplanation } from '../services/geminiService';
import Button from './Button';
import Card from './Card';
import CodeIcon from './icons/CodeIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import LineChart from './charts/LineChart';

interface AssessmentViewProps {
  config: AssessmentConfig | QuizConfig;
  onComplete: (result: EvaluationResult) => void;
  onCancel: () => void;
  userActivity: UserActivity[];
}

const getTimerDuration = (question: AssessmentQuestion): number => {
    if (question.type === QuestionType.PROGRAMMING) {
        return 30 * 60; // 30 minutes
    }
    return 60; // 60 seconds
};

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

const AssessmentView: React.FC<AssessmentViewProps> = ({ config, onComplete, onCancel, userActivity }) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<EvaluationResult | null>(null);
  
  const [clarifiedConcepts, setClarifiedConcepts] = useState<Record<number, string>>({});
  const [isClarifying, setIsClarifying] = useState<number | null>(null);

  const [activeHint, setActiveHint] = useState<{ index: number; text: string } | null>(null);
  const [isHintLoading, setIsHintLoading] = useState<number | null>(null);

  const [timer, setTimer] = useState(60);
  const [progCode, setProgCode] = useState('');
  const [runResult, setRunResult] = useState<CodeExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);


  useEffect(() => {
    setIsLoading(true);
    if (config.type === 'assessment') {
        generateAssessmentQuestions(config).then(qs => {
            setQuestions(qs);
            setIsLoading(false);
        });
    } else {
        generateDynamicQuiz(config).then(qs => {
            setQuestions(qs);
            setIsLoading(false);
        })
    }
  }, [config]);

  const currentQuestion = useMemo(() => questions[currentQuestionIndex], [questions, currentQuestionIndex]);

  useEffect(() => {
    if (currentQuestion) {
        setTimer(getTimerDuration(currentQuestion));
        setRunResult(null); // Clear previous run results
        setActiveHint(null); // Clear hint when question changes
        if (currentQuestion.type === QuestionType.PROGRAMMING) {
            const existingAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex);
            setProgCode(existingAnswer?.code || (currentQuestion as ProgrammingQuestion).starterCode || '');
        }
    }
  }, [currentQuestion, currentQuestionIndex, userAnswers]);

  useEffect(() => {
    if (timer > 0 && !isLoading && !finalResult) {
      const interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && !isLoading && !finalResult) {
      if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(i => i + 1);
      } else {
          handleSubmit();
      }
    }
  }, [timer, isLoading, finalResult, currentQuestionIndex, questions.length]);

  const updateAnswer = (answer: UserAnswer) => {
      const existingAnswer = userAnswers.find(a => a.questionIndex === answer.questionIndex);
      if (existingAnswer) {
          setUserAnswers(userAnswers.map(a => a.questionIndex === answer.questionIndex ? answer : a));
      } else {
          setUserAnswers([...userAnswers, answer]);
      }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    updateAnswer({ questionIndex: currentQuestionIndex, answerIndex });
  };
  
  const handleNext = () => {
    if (currentQuestion.type === QuestionType.PROGRAMMING) {
        const passedCount = runResult?.testResults?.filter(r => r.passed).length ?? 0;
        updateAnswer({
            questionIndex: currentQuestionIndex,
            code: progCode,
            passed_tests: passedCount
        });
    }
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let finalAnswers = [...userAnswers];
    if (currentQuestion?.type === QuestionType.PROGRAMMING) {
        const existingAnswer = finalAnswers.find(a => a.questionIndex === currentQuestionIndex);
        if (!existingAnswer) {
            const passedCount = runResult?.testResults?.filter(r => r.passed).length ?? 0;
            finalAnswers.push({ questionIndex: currentQuestionIndex, code: progCode, passed_tests: passedCount });
        }
    }
    const result = await evaluateAssessment(questions, finalAnswers, config);
    setFinalResult(result);
    setIsSubmitting(false);
  }, [isSubmitting, userAnswers, currentQuestion, currentQuestionIndex, progCode, runResult, questions, config]);

  const handleRunCode = async () => {
    if (currentQuestion.type !== QuestionType.PROGRAMMING) return;
    setIsRunning(true);
    setRunResult(null);
    const result = await evaluateCodeAgainstTestCases(progCode, config.language, (currentQuestion as ProgrammingQuestion).testCases);
    setRunResult(result);
    setIsRunning(false);
  };
  
  const handleGetClarified = async (questionIndex: number, questionText: string) => {
    if (isClarifying !== null || clarifiedConcepts[questionIndex]) return;
    setIsClarifying(questionIndex);
    const explanation = await getConceptExplanation(questionText);
    setClarifiedConcepts(prev => ({ ...prev, [questionIndex]: explanation }));
    setIsClarifying(null);
  };

  const handleGetHint = async (questionIndex: number, questionText: string) => {
    if (isHintLoading !== null) return;
    setActiveHint(null);
    setIsHintLoading(questionIndex);
    const hintText = await getConceptExplanation(questionText);
    setActiveHint({ index: questionIndex, text: hintText });
    setIsHintLoading(null);
  };

  const selectedAnswer = useMemo(() => userAnswers.find(a => a.questionIndex === currentQuestionIndex)?.answerIndex, [userAnswers, currentQuestionIndex]);
  
  const assessmentTitle = useMemo(() => {
      const { language, difficulty } = config;
      if (config.type === 'assessment' && (config as AssessmentConfig).customTopic) {
          return `${language} - ${(config as AssessmentConfig).customTopic} (${difficulty})`;
      }
      return `${config.type === 'assessment' ? 'Assessment' : 'Quiz'}: ${language} (${difficulty})`;
  }, [config]);
  
  const performanceData = useMemo(() => {
    if (!finalResult) return [];
    
    const newActivity: UserActivity = {
        type: config.type,
        language: config.language,
        score: finalResult.score,
        date: new Date().toISOString()
    };

    const allActivity = [...userActivity, newActivity];

    return allActivity
        .filter(item => item.type === 'assessment' || item.type === 'quiz')
        .map(item => ({
            label: `${item.language.substring(0,4)} (${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
            value: item.score || 0
        }));
    }, [finalResult, userActivity, config]);

    const renderCriterion = (name: string, data: { score: number; feedback: string; }) => (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-baseline">
                <h5 className="font-semibold text-gray-800 dark:text-gray-200">{name}</h5>
                <span className="font-bold text-lg text-blue-500 dark:text-blue-400">{data.score} / 5</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{data.feedback}</p>
        </div>
    );

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-6 text-2xl text-gray-700 dark:text-gray-300">Preparing Your {assessmentTitle}...</p>
    </div>;
  }
  if (isSubmitting) {
    return <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-green-500"></div>
        <p className="mt-6 text-2xl text-gray-700 dark:text-gray-300">Evaluating Your Answers...</p>
    </div>;
  }
  if (finalResult) {
    return <Card title={`Result: ${finalResult.score}%`} icon={<CodeIcon />}>
        <div className="space-y-6"><h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Overall Feedback for {assessmentTitle}:</h3><p className="text-gray-600 dark:text-gray-300 italic">"{finalResult.feedback}"</p>
          <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Detailed Breakdown:</h3>
             {finalResult.detailedResults.map((res: DetailedEvaluationResult, index) => (
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
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleGetClarified(index, res.questionText)}
                            disabled={isClarifying === index}
                        >
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

          <div className="flex justify-end pt-4"><Button onClick={() => onComplete(finalResult)}>Continue to Dashboard</Button></div>
        </div>
      </Card>;
  }

  const renderMCQ = (question: MCQQuestion) => (
    <>
      <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Question {currentQuestionIndex + 1}: {question.questionText}</h3>
          <button 
            onClick={() => handleGetHint(currentQuestionIndex, question.questionText)}
            disabled={isHintLoading === currentQuestionIndex}
            className="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300 disabled:opacity-50 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ml-4 flex-shrink-0"
            aria-label="Get a hint"
          >
            {isHintLoading === currentQuestionIndex ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-yellow-400"></div>
            ) : (
              <LightbulbIcon className="h-5 w-5" />
            )}
          </button>
      </div>
       {activeHint && activeHint.index === currentQuestionIndex && (
            <div className="my-3 p-3 bg-gray-100 dark:bg-gray-900/50 border-l-4 border-yellow-400 text-sm text-gray-700 dark:text-gray-300 animate-fade-in flex justify-between items-center">
                <p className="pr-4"><strong>Hint:</strong> {activeHint.text}</p>
                <button onClick={() => setActiveHint(null)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white flex-shrink-0 font-bold text-lg leading-none" aria-label="Close hint">&times;</button>
            </div>
        )}
      <div className="space-y-3">
          {question.options.map((option: string, index: number) => (
              <label key={index} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedAnswer === index ? 'bg-blue-600/20 dark:bg-blue-600/30 border-blue-500' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                  <input type="radio" name={`question-${currentQuestionIndex}`} value={index} checked={selectedAnswer === index} onChange={() => handleSelectAnswer(index)} className="h-4 w-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500" />
                  <span className="ml-4 text-gray-800 dark:text-gray-200">{option}</span>
              </label>
          ))}
      </div>
    </>
  );

  const renderProgramming = (question: ProgrammingQuestion) => (
    <>
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Question {currentQuestionIndex + 1}: {question.questionText}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
              <div className="prose dark:prose-invert prose-sm max-w-none bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <p>{question.description}</p>
                  <h4 className="font-semibold">Constraints:</h4>
                  <ul>{question.constraints.map(c => <li key={c}>{c}</li>)}</ul>
              </div>
              <div>
                  <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Visible Test Cases</h4>
                  <div className="space-y-2">
                      {question.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                          <div key={i} className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md text-xs">
                              <p><span className="font-semibold text-gray-500 dark:text-gray-400">Input:</span> <code className="text-yellow-600 dark:text-yellow-300">{tc.input.replace(/\n/g, "\\n")}</code></p>
                              <p><span className="font-semibold text-gray-500 dark:text-gray-400">Expected Output:</span> <code className="text-yellow-600 dark:text-yellow-300">{tc.expectedOutput.replace(/\n/g, "\\n")}</code></p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
          <div className="space-y-4">
              <textarea value={progCode} onChange={e => setProgCode(e.target.value)} className="w-full h-80 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md p-3 font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500" />
              <Button onClick={handleRunCode} disabled={isRunning}>{isRunning ? "Running..." : "Run Code"}</Button>
              {isRunning && <p className="text-sm text-yellow-500 dark:text-yellow-400">Checking against test cases...</p>}
              {runResult && (
                  <div className={`p-3 rounded-md border text-sm ${runResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      {runResult.error ? <pre className="text-red-400 dark:text-red-300 whitespace-pre-wrap">Error: {runResult.error}</pre> : 
                      <p className="font-bold text-green-600 dark:text-green-300">{runResult.testResults?.filter(r => r.passed).length} / {runResult.testResults?.length} Test Cases Passed</p>}
                  </div>
              )}
          </div>
      </div>
    </>
  );
  
  return (
    <Card title={assessmentTitle} icon={<CodeIcon />}>
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                <div className={`ml-4 text-lg font-bold ${timer < 30 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{formatTime(timer)}</div>
            </div>
            
            {currentQuestion?.type === QuestionType.MCQ ? renderMCQ(currentQuestion as MCQQuestion) : renderProgramming(currentQuestion as ProgrammingQuestion)}

            <div className="flex justify-between items-center pt-4">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <div>
                    {currentQuestionIndex > 0 && (
                        <Button variant="secondary" className="mr-2" onClick={() => setCurrentQuestionIndex(i => i - 1)}>Previous</Button>
                    )}
                    {currentQuestionIndex < questions.length - 1 ? (
                        <Button onClick={handleNext} disabled={currentQuestion?.type === QuestionType.MCQ && selectedAnswer === undefined}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={(currentQuestion?.type === QuestionType.MCQ && selectedAnswer === undefined)}>Submit</Button>
                    )}
                </div>
            </div>
        </div>
    </Card>
  );
};

export default AssessmentView;
