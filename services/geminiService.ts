
import { GoogleGenAI } from "@google/genai";
import { AssessmentQuestion, UserAnswer, EvaluationResult, TutorContent, AssessmentConfig, QuizConfig, QuestionType, ProgrammingQuestion, MCQQuestion, CodeExecutionResult, KnowledgeDocument, TutorPace, ChallengeQuestion, ChallengeEvaluationResult, DetailedEvaluationResult, CompanyQuestion, Skill, LearningPath, LearningPathModule, ModuleDetails, LearnApproach, SolutionEvaluation, UserProfile, ProgressInsights, ConceptQuestion, ResumeAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';


// For enhanced security, it's recommended to load the API key from an environment variable.


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL"
];

const mcqQuestionsSchema = {
    type: "OBJECT",
    properties: {
        questions: {
            type: "ARRAY",
            description: "A list of diverse multiple-choice questions based on the user's criteria.",
            items: {
                type: "OBJECT",
                properties: {
                    questionText: { type: "STRING", description: "The text of the question." },
                    options: { type: "ARRAY", description: "An array of 4 possible string answers.", items: { type: "STRING" } },
                    correctAnswerIndex: { type: "INTEGER", description: "The 0-based index of the correct option in the 'options' array." },
                },
                required: ["questionText", "options", "correctAnswerIndex"],
            }
        }
    },
    required: ["questions"],
};

const programmingQuestionSchema = {
    type: "OBJECT",
    properties: {
        questionText: { type: "STRING", description: "A concise and clear title for the programming problem." },
        description: { type: "STRING", description: "A detailed, real-world scenario-based problem description. Should include what the function should do, input format, and output format." },
        constraints: { type: "ARRAY", items: { type: "STRING" }, description: "A list of constraints for the problem, like input size, value ranges, etc." },
        starterCode: { type: "STRING", description: "Boilerplate code or a function signature for the user to start with." },
        testCases: {
            type: "ARRAY",
            description: "An array of 5 test cases. The first 2 should be visible (hidden: false), the next 3 should be hidden (hidden: true).",
            items: {
                type: "OBJECT",
                properties: {
                    input: { type: "STRING", description: "The input for the test case, formatted as a string (e.g., for multiple arguments, use a separator like a newline)." },
                    expectedOutput: { type: "STRING", description: "The expected standard output for the given input." },
                    hidden: { type: "BOOLEAN", description: "Whether this test case is hidden from the user." }
                },
                required: ["input", "expectedOutput", "hidden"]
            }
        }
    },
    required: ["questionText", "description", "constraints", "starterCode", "testCases"]
};

const conceptQuestionSchema = {
    type: "OBJECT",
    properties: {
        title: { type: "STRING", description: "The title of the coding problem." },
        difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
        acceptanceRate: { type: "STRING", description: "A fictional but realistic acceptance rate, e.g., '45.2%'." },
        topics: { type: "ARRAY", items: { type: "STRING" }, description: "An array of 2-4 relevant topics (e.g., 'Array', 'Hash Table')." },
        questionText: { type: "STRING", description: "A detailed problem statement. It MUST include an 'Example 1', 'Example 2', and 'Constraints' section, each clearly marked and formatted with newlines." },
        similarQuestions: { type: "ARRAY", items: { type: "STRING" }, description: "An array of 3 titles for similar questions." },
        testCases: {
            type: "ARRAY",
            description: "An array of 3-5 test cases. The first 2 should be visible (hidden: false), the rest should be hidden (hidden: true).",
            items: {
                type: "OBJECT",
                properties: {
                    input: { type: "STRING", description: "The input for the test case, formatted as a string (e.g., for multiple arguments, use a separator like a newline)." },
                    expectedOutput: { type: "STRING", description: "The expected standard output for the given input." },
                    hidden: { type: "BOOLEAN", description: "Whether this test case is hidden from the user." }
                },
                required: ["input", "expectedOutput", "hidden"]
            }
        }
    },
    required: ["title", "difficulty", "acceptanceRate", "topics", "questionText", "similarQuestions", "testCases"]
};


const challengeQuestionSchema = {
    type: "OBJECT",
    properties: {
        questionText: { type: "STRING", description: "A concise and clear title for the programming problem related to 'AI for Good'." },
        description: { type: "STRING", description: "A detailed, real-world 'AI for Good' scenario-based problem description. For example, optimizing routes for disaster relief, classifying medical images, or analyzing environmental data. Should include what the function should do, input format, and output format." },
        constraints: { type: "ARRAY", items: { type: "STRING" }, description: "A list of constraints for the problem, like input size, value ranges, etc." },
        starterCode: { type: "STRING", description: "Boilerplate code or a function signature for the user to start with." },
        testCases: {
            type: "ARRAY",
            description: "An array of exactly 7 test cases. The first 3 must be visible (hidden: false), the next 4 must be hidden (hidden: true). The test cases should be comprehensive.",
            items: {
                type: "OBJECT",
                properties: {
                    input: { type: "STRING", description: "The input for the test case, formatted as a string." },
                    expectedOutput: { type: "STRING", description: "The expected standard output for the given input." },
                    hidden: { type: "BOOLEAN", description: "Whether this test case is hidden from the user." }
                },
                required: ["input", "expectedOutput", "hidden"]
            }
        }
    },
    required: ["questionText", "description", "constraints", "starterCode", "testCases"]
};

const challengeEvaluationSchema = {
    type: "OBJECT",
    properties: {
        logicalThinkingAnalysis: {
            type: "STRING",
            description: "A short, positive, and encouraging analysis (2-3 sentences) of the user's code. Comment on the approach, logic, and potential for improvement. Include a few words of appraisal, like 'Great job!', 'Excellent approach!', or 'Solid work!'."
        }
    },
    required: ["logicalThinkingAnalysis"]
};

const programmingEvaluationCriteriaSchema = {
    type: "OBJECT",
    description: "A detailed evaluation for a programming question. This MUST NOT be included for MCQs.",
    properties: {
        correctness: {
            type: "OBJECT",
            properties: {
                score: { type: "INTEGER", description: "Score from 0-5 for correctness and edge case handling." },
                feedback: { type: "STRING", description: "1-2 sentences feedback on correctness and edge cases." }
            },
            required: ["score", "feedback"]
        },
        timeComplexity: {
            type: "OBJECT",
            properties: {
                score: { type: "INTEGER", description: "Score from 0-5 for time complexity (Big O)." },
                feedback: { type: "STRING", description: "1-2 sentences feedback on time complexity, mentioning the ideal Big O if possible." }
            },
            required: ["score", "feedback"]
        },
        dataStructures: {
            type: "OBJECT",
            properties: {
                score: { type: "INTEGER", description: "Score from 0-5 for appropriate choice of data structures." },
                feedback: { type: "STRING", description: "1-2 sentences feedback on data structure usage." }
            },
            required: ["score", "feedback"]
        },
        spaceComplexity: {
            type: "OBJECT",
            properties: {
                score: { type: "INTEGER", description: "Score from 0-5 for space complexity." },
                feedback: { type: "STRING", description: "1-2 sentences feedback on memory usage." }
            },
            required: ["score", "feedback"]
        },
        logicSimplicity: {
            type: "OBJECT",
            properties: {
                score: { type: "INTEGER", description: "Score from 0-5 for simplicity and directness of logic." },
                feedback: { type: "STRING", description: "1-2 sentences feedback on code readability and structure." }
            },
            required: ["score", "feedback"]
        },
    },
    required: ["correctness", "timeComplexity", "dataStructures", "spaceComplexity", "logicSimplicity"]
};


const evaluationResultSchema = {
    type: "OBJECT",
    properties: {
        score: { type: "INTEGER", description: "A score for the user's performance from 0 to 100." },
        feedback: { type: "STRING", description: "Overall feedback for the user based on their performance, highlighting strengths and areas for improvement." },
        detailedResults: {
            type: "ARRAY",
            description: "An array containing a detailed breakdown of each answer.",
            items: {
                type: "OBJECT",
                properties: {
                    questionText: { type: "STRING" },
                    userAnswer: { type: "STRING" },
                    isCorrect: { type: "BOOLEAN" },
                    explanation: { type: "STRING", description: "A brief explanation of why the answer is correct or incorrect." },
                    correctAnswerText: { type: "STRING", description: "For incorrect MCQ answers ONLY, provide the full text of the correct answer. For correct answers or programming questions, this MUST be omitted." },
                    programmingEvaluation: programmingEvaluationCriteriaSchema,
                    correctCodeSolution: { type: "STRING", description: "For programming questions ONLY, provide a clean, correct, and optimal code solution in the assessed language. For MCQs, this MUST be omitted." }
                },
                required: ["questionText", "userAnswer", "isCorrect", "explanation"]
            }
        }
    },
    required: ["score", "feedback", "detailedResults"]
};

const tutorContentSchema = {
    type: "OBJECT",
    properties: {
      subTopicTitle: { type: "STRING", description: "The title of this specific lesson part."},
      explanation: { type: "STRING", description: "A detailed, lengthy explanation of the sub-topic, tailored to the selected pace. It should be formatted with paragraphs and bullet points for readability. DO NOT include markdown like '#' or '**'." },
      codeExample: { 
          type: "OBJECT",
          properties: {
              language: { type: "STRING", description: "The programming language of the code snippet (e.g., 'javascript')." },
              code: { type: "STRING", description: "A relevant, well-commented code example." }
          },
          required: ["language", "code"]
      },
      realWorldExample: { type: "STRING", description: "A relatable, real-world analogy or example for the concept." },
      isFinished: { type: "BOOLEAN", description: "Set to true only if this is the final part of the main topic." },
      nextTopicSuggestion: { type: "STRING", description: "If isFinished is true, suggest a logical next topic to learn. Otherwise, this can be empty." }
    },
    required: ["subTopicTitle", "explanation", "codeExample", "realWorldExample", "isFinished"]
};


const codeExecutionResultSchema = {
    type: "OBJECT",
    properties: {
        testResults: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    passed: { type: "BOOLEAN" },
                    input: { type: "STRING" },
                    output: { type: "STRING" },
                    expected: { type: "STRING" }
                },
                required: ["passed", "input", "output", "expected"]
            }
        },
        error: { type: "STRING", description: "Compilation or runtime error message, if any. Otherwise, an empty string." }
    },
    required: ["testResults", "error"]
};

const starterCodeSchema = {
    type: "OBJECT",
    properties: {
        starterCode: {
            type: "STRING",
            description: "Boilerplate code or a function signature for the user to start with."
        }
    },
    required: ["starterCode"]
};

const learningPathSchema = {
    type: "OBJECT",
    properties: {
        title: { type: "STRING", description: "A concise, motivational title for the learning path." },
        summary: { type: "STRING", description: "A 2-3 sentence summary of what this learning path covers and its career benefits." },
        modules: {
            type: "ARRAY",
            description: "A list of 5-7 distinct learning modules, ordered logically.",
            items: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "The title of the learning module." },
                    description: { type: "STRING", description: "A short, actionable description of what to learn or do in this module." },
                    estimatedTime: { type: "STRING", description: "A realistic time estimate to complete the module, e.g., '1-2 hours', '30 minutes'." }
                },
                required: ["title", "description", "estimatedTime"]
            }
        }
    },
    required: ["title", "summary", "modules"]
};

const progressInsightsSchema = {
    type: "OBJECT",
    properties: {
        progressSummary: { 
            type: "STRING", 
            description: "A 2-3 sentence summary of the user's overall progress, focusing on their learning path module completion rate and overall engagement." 
        },
        languageAnalysis: { 
            type: "STRING", 
            description: "A 2-3 sentence analysis of the user's most used programming languages based on their activity log. Comment on performance trends (e.g., improving scores)." 
        },
        inactivityAnalysis: { 
            type: "STRING", 
            description: "A 2-3 sentence observation on the user's activity patterns. Highlight any long periods of inactivity and suggest a friendly re-engagement strategy." 
        },
        nextSteps: { 
            type: "STRING", 
            description: "Based on their incomplete learning path modules and skill levels, recommend 1-2 specific modules or topics for the user to tackle next." 
        },
    },
    required: ["progressSummary", "languageAnalysis", "inactivityAnalysis", "nextSteps"]
};

const solutionEvaluationSchema = {
    type: "OBJECT",
    properties: {
        timeComplexity: {
            type: "STRING",
            description: "An analysis of the code's time complexity (Big O notation)."
        },
        spaceComplexity: {
            type: "STRING",
            description: "An analysis of the code's space complexity (Big O notation)."
        },
        feedback: {
            type: "STRING",
            description: "Constructive feedback on the code's logic, clarity, and correctness. Be encouraging."
        },
        betterApproachSuggestion: {
            type: "STRING",
            description: "If applicable, suggest a better approach or optimization. Otherwise, this MUST be omitted."
        }
    },
    required: ["timeComplexity", "spaceComplexity", "feedback"]
};

const resumeSkillsSchema = {
    type: "OBJECT",
    properties: {
        skills: {
            type: "ARRAY",
            description: "A list of 5-10 key technical skills found in the resume.",
            items: { type: "STRING" }
        }
    },
    required: ["skills"]
};

const resumeAnalysisSchema = {
    type: "OBJECT",
    properties: {
        summary: { type: "STRING", description: "A 2-3 sentence professional summary of the candidate based on the resume." },
        extractedSkills: {
            type: "ARRAY",
            description: "A list of 10-15 key technical skills found in the resume.",
            items: { type: "STRING" }
        },
        workExperience: {
            type: "ARRAY",
            description: "A list of the candidate's work experiences.",
            items: {
                type: "OBJECT",
                properties: {
                    role: { type: "STRING", description: "The job title or role." },
                    company: { type: "STRING", description: "The name of the company." },
                    startDate: { type: "STRING", description: "The start date in YYYY-MM format." },
                    endDate: { type: "STRING", description: "The end date in YYYY-MM format, or 'Present'." },
                    description: { type: "STRING", description: "A brief summary of responsibilities and achievements." }
                },
                required: ["role", "company", "startDate", "endDate", "description"]
            }
        },
        education: {
            type: "ARRAY",
            description: "A list of the candidate's educational qualifications.",
            items: {
                type: "OBJECT",
                properties: {
                    institution: { type: "STRING", description: "The name of the university or institution." },
                    degree: { type: "STRING", description: "The degree or qualification obtained." },
                    startDate: { type: "STRING", description: "The start date in YYYY-MM format." },
                    endDate: { type: "STRING", description: "The end date in YYYY-MM format." },
                    description: { type: "STRING", description: "Any additional details, like GPA or honors." }
                },
                required: ["institution", "degree", "startDate", "endDate"]
            }
        }
    },
    required: ["summary", "extractedSkills", "workExperience", "education"]
};


export const generateAssessmentQuestions = async (config: AssessmentConfig): Promise<MCQQuestion[]> => {
    const topicFocus = config.customTopic ? `The questions should specifically target the topic of "${config.customTopic}".` : 'The questions should cover a range of topics appropriate for the difficulty level.';
    const prompt = `
    Generate ${config.numberOfQuestions} multiple-choice questions for a programming assessment.
    Language: ${config.language}
    Difficulty: ${config.difficulty}
    ${topicFocus}
    Each question must have 4 options, and one must be clearly correct.
    Each question MUST include the 0-based index of the correct answer.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: mcqQuestionsSchema },
        });
        const result = JSON.parse(response.text.trim());
        return result.questions.map((q: Omit<MCQQuestion, 'type'>) => ({ ...q, type: QuestionType.MCQ }));
    } catch (error) {
        console.error("Error generating assessment questions with Gemini:", error);
        return [{ type: QuestionType.MCQ, questionText: "Error: Could not generate questions.", options: ["Please try again later.", "", "", ""], correctAnswerIndex: 0 }];
    }
};

export const generateDynamicQuiz = async (config: QuizConfig): Promise<AssessmentQuestion[]> => {
    const questions: AssessmentQuestion[] = [];
    const topicFocus = config.customTopic ? `The questions should specifically target the topic of "${config.customTopic}".` : 'The questions should cover a range of topics appropriate for the difficulty level.';

    // Generate MCQs
    const numMcqs = config.numberOfQuestions - config.numberOfProgrammingQuestions;
    if (numMcqs > 0) {
        const mcqPrompt = `Generate ${numMcqs} multiple-choice questions for a quiz. Language: ${config.language}, Difficulty: ${config.difficulty}. ${topicFocus}. Each question must have 4 options and the 0-based index of the correct answer.`;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", contents: mcqPrompt,
                config: { responseMimeType: "application/json", responseSchema: mcqQuestionsSchema },
            });
            const result = JSON.parse(response.text.trim());
            questions.push(...result.questions.map((q: Omit<MCQQuestion, 'type'>) => ({ ...q, type: QuestionType.MCQ })));
        } catch (error) {
            console.error("Error generating MCQs:", error);
        }
    }

    // Generate Programming Questions
    const numProgQs = config.numberOfProgrammingQuestions;
    if (numProgQs > 0) {
        const progQuestionPromises = [];
        for (let i = 0; i < numProgQs; i++) {
            const progPrompt = `Generate one real-world scenario programming question for a quiz. Language: ${config.language}, Difficulty: ${config.difficulty}. ${topicFocus}. This is question ${i + 1} of ${numProgQs} programming questions. Ensure it is unique from other potential questions in this set. Ensure the test cases are valid and cover edge cases. The first two test cases must be visible (hidden: false), the next three must be hidden (hidden: true).`;
            progQuestionPromises.push(
                ai.models.generateContent({
                    model: "gemini-2.5-flash", contents: progPrompt,
                    config: { responseMimeType: "application/json", responseSchema: programmingQuestionSchema },
                })
            );
        }
        try {
            const responses = await Promise.all(progQuestionPromises);
            for (const response of responses) {
                const result = JSON.parse(response.text.trim()) as Omit<ProgrammingQuestion, 'type'>;
                questions.push({ ...result, type: QuestionType.PROGRAMMING });
            }
        } catch (error) {
            console.error("Error generating programming questions:", error);
        }
    }

    // Shuffle questions to mix MCQs and programming questions
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions;
};


export const evaluateAssessment = async (questions: AssessmentQuestion[], answers: UserAnswer[], config: AssessmentConfig | QuizConfig): Promise<EvaluationResult> => {
    const userAnswersWithDetails = answers.map(a => {
        const question = questions[a.questionIndex];
        if (question.type === QuestionType.MCQ) {
            return {
                questionType: 'MCQ',
                questionText: question.questionText,
                options: question.options,
                correctAnswerIndex: question.correctAnswerIndex,
                userAnswer: question.options[a.answerIndex!]
            };
        }
        return {
            questionType: 'Programming',
            questionText: question.questionText,
            userAnswer: `Submitted code and passed ${a.passed_tests} out of ${question.testCases.length} test cases.`,
            code: a.code,
        };
    });

    const topicDescription = `assessment on the topic of ${config.language} (${config.difficulty})`;

    const prompt = `
    Please act as a senior software engineer evaluating a candidate's ${topicDescription}.
    Here are the questions and the user's submitted answers:
    ${JSON.stringify(userAnswersWithDetails, null, 2)}
    
    Based on this, provide a final score out of 100, overall feedback, and a detailed breakdown for each question according to the provided JSON schema.

    For Multiple Choice Questions (MCQ):
    - The user's answer is provided. The full question, options, and the index of the correct answer are also provided.
    - Determine if the user's answer is correct by comparing it to the correct option.
    - Provide a brief explanation.
    - If the user's answer is INCORRECT, you MUST populate the 'correctAnswerText' field with the text of the correct answer.
    - The 'programmingEvaluation' and 'correctCodeSolution' fields MUST be null or omitted.

    For Programming Questions:
    - The 'isCorrect' field should be true if a reasonable number of tests passed (e.g., > 50%), and false otherwise.
    - Provide a qualitative explanation of their solution in the 'explanation' field.
    - You MUST provide a detailed evaluation in the 'programmingEvaluation' field based on the following criteria, each scored from 0 to 5:
        1. Correctness and Edge Case Handling: How well the code solves the problem and handles edge cases.
        2. Time Complexity (Big O): The efficiency of the algorithm.
        3. Appropriate Choice of Data Structures: Did the user choose suitable data structures?
        4. Space Complexity (Memory Usage): The memory efficiency of the solution.
        5. Simplicity and Directness of Logic: How readable and maintainable the code is.
    - For each of the 5 criteria, provide a score (0-5) and a brief feedback string.
    - You MUST also provide an optimal, correct code solution in the 'correctCodeSolution' field.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: evaluationResultSchema },
        });
        
        const result: EvaluationResult = JSON.parse(response.text.trim());

        // Post-process to add totalScore and overallFeedback
        result.detailedResults.forEach((detail: DetailedEvaluationResult) => {
            if (detail.programmingEvaluation) {
                const pe = detail.programmingEvaluation;
                const totalScore = (pe.correctness.score || 0) + 
                                   (pe.timeComplexity.score || 0) + 
                                   (pe.dataStructures.score || 0) + 
                                   (pe.spaceComplexity.score || 0) + 
                                   (pe.logicSimplicity.score || 0);
                pe.totalScore = totalScore;

                if (totalScore <= 9) {
                    pe.overallFeedback = "You need to work more";
                } else if (totalScore <= 19) {
                    pe.overallFeedback = "You have a good knowledge but improve it a little";
                } else {
                    pe.overallFeedback = "You are in having a very good knowldege in this concept";
                }
            }
        });

        return result;
    } catch (error) {
        console.error("Error evaluating assessment with Gemini:", error);
        return { score: 0, feedback: "Error: Could not evaluate assessment.", detailedResults: [] };
    }
};

export const generateTutorContent = async (topic: string, pace: TutorPace, history: TutorContent[]): Promise<TutorContent> => {
    const historySummary = history.map((h, i) => `${i + 1}. ${h.subTopicTitle}`).join('\n');

    const prompt = `
    You are an expert programming tutor. Your student wants to learn about: "${topic}".
    Their desired learning pace is "${pace}".

    The lesson history so far is:
    ${historySummary ? historySummary : "This is the beginning of the lesson."}

    Based on this, generate the very next logical sub-topic in the lesson.
    Do NOT repeat content from the lesson history.
    Your explanation must be detailed, lengthy, and easy to understand for the chosen pace. Do NOT use markdown like '#' or '**'. Use newline characters for paragraphs.
    Your explanation MUST NOT include any external links or URLs.
    Provide one real-world analogy and one clear, well-commented programming example.
    The programming example's language should be relevant to the main topic (e.g., if the topic is "React State", the language is "javascript").
    If you believe the main topic is now fully covered, set 'isFinished' to true and suggest a logical next topic in 'nextTopicSuggestion'.

    Your response MUST be in JSON format, adhering to the provided schema.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: tutorContentSchema },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating tutor content with Gemini:", error);
        return { 
            subTopicTitle: "Error",
            explanation: "An error occurred while generating the next part of your lesson. Please try again.",
            codeExample: { language: 'text', code: 'error' },
            realWorldExample: "An error occurred.",
            isFinished: true,
         };
    }
};

export const executeCode = async (code: string, language: string, input: string): Promise<Pick<CodeExecutionResult, 'output' | 'error'>> => {
    const prompt = `Act as a ${language} code interpreter. Execute the following code with this standard input provided below.
---INPUT---
${input}
---CODE---
${code}
---END---
Provide ONLY the raw standard output. If there is a compilation or runtime error, provide ONLY the standard error message.`;

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        // This is a simplification; a real implementation would need to distinguish between stdout and stderr.
        // For this app, we'll assume Gemini gives us output on success and an error message on failure.
        // A more robust check could be to see if the response contains words like "error", "exception", etc.
        const text = response.text.trim();
        if (text.toLowerCase().includes('error') || text.toLowerCase().includes('exception')) {
             return { output: '', error: text };
        }
        return { output: text, error: '' };
    } catch (error) {
        console.error("Error executing code with Gemini:", error);
        return { output: '', error: 'Failed to execute code.' };
    }
};

export const evaluateCodeAgainstTestCases = async (code: string, language: string, testCases: ProgrammingQuestion['testCases']): Promise<CodeExecutionResult> => {
    const prompt = `You are a code judge. Take the following ${language} code and run it against the provided test cases. For each test case, compare the code's actual standard output with the expected output. The code's output must be an exact match to the expected output to pass.
---CODE---
${code}
---TEST CASES---
${JSON.stringify(testCases.map(tc => ({input: tc.input, expectedOutput: tc.expectedOutput})))}
---END---
Return a JSON object matching the provided schema. If the code fails to compile or has a runtime error, the 'error' field should contain the error message, and the 'testResults' array should be empty.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: codeExecutionResultSchema },
        });
        const result: Omit<CodeExecutionResult, 'success'> = JSON.parse(response.text.trim());
        const success = !result.error && result.testResults.every(r => r.passed);
        return { ...result, success };
    } catch (error) {
        console.error("Error evaluating code against test cases with Gemini:", error);
        return { success: false, error: 'Failed to judge code.', testResults: [] };
    }
};


export const getConceptExplanation = async (concept: string): Promise<string> => {
    const prompt = `Briefly explain the core idea behind the following programming concept or question in 1-2 sentences. Keep it simple and direct.
    Concept: "${concept}"`;

    try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting concept explanation:", error);
        return "Could not load explanation.";
    }
};


export const generateChallengeQuestion = async (language: string): Promise<ChallengeQuestion> => {
    const prompt = `Generate one challenging, real-world "AI for Good" scenario programming question. Language: ${language}, Difficulty: Hard. The test cases must be thorough and cover edge cases. The first 3 test cases must be visible, the next 4 must be hidden.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: challengeQuestionSchema },
        });
        const result: Omit<ChallengeQuestion, 'type'> = JSON.parse(response.text.trim());
        return { ...result, type: QuestionType.PROGRAMMING };
    } catch (error) {
        console.error("Error generating challenge question:", error);
        throw new Error("Failed to generate the challenge question.");
    }
};

export const evaluateChallengeSubmission = async (code: string, language: string, question: ChallengeQuestion): Promise<ChallengeEvaluationResult> => {
    const testCaseResults = await evaluateCodeAgainstTestCases(code, language, question.testCases);
    
    if (testCaseResults.error) {
         return {
            testCaseResults,
            logicalThinkingAnalysis: "Could not analyze logic due to a code error. Please fix the error and resubmit."
        }
    }

    const prompt = `A user submitted the following ${language} code for the problem "${question.questionText}".
---CODE---
${code}
---END---
Please provide a short, positive, and encouraging analysis (2-3 sentences) of the user's code. Comment on their approach, logic, and potential for improvement. Include a few words of appraisal, like 'Great job!', 'Excellent approach!', or 'Solid work!'.
    `;
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: challengeEvaluationSchema },
        });
        const result = JSON.parse(response.text.trim());
        return {
            testCaseResults,
            logicalThinkingAnalysis: result.logicalThinkingAnalysis,
        };
    } catch (error) {
        console.error("Error evaluating challenge submission:", error);
        return {
            testCaseResults,
            logicalThinkingAnalysis: "An error occurred while analyzing your submission's logic."
        }
    }
};

export const generateDailyMission = async (dateString: string, language: string): Promise<ProgrammingQuestion> => {
    const prompt = `Generate one unique, real-world scenario programming question suitable for a daily coding challenge on ${dateString}. The language is ${language}. Difficulty should be Medium. Ensure the test cases are valid and cover edge cases. The first two test cases must be visible (hidden: false), the next three must be hidden (hidden: true).`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: programmingQuestionSchema },
        });
        const result: Omit<ProgrammingQuestion, 'type'> = JSON.parse(response.text.trim());
        return { ...result, type: QuestionType.PROGRAMMING };
    } catch (error) {
        console.error("Error generating daily mission question:", error);
        throw new Error("Failed to generate the daily mission question.");
    }
};

export const generateStarterCodeForMission = async (question: Omit<ProgrammingQuestion, 'type' | 'starterCode'>, language: string): Promise<string> => {
    const prompt = `Given the programming problem "${question.questionText}", generate only the starter code (function signature or boilerplate) for the ${language} language.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: starterCodeSchema },
        });
        const result = JSON.parse(response.text.trim());
        return result.starterCode;
    } catch (error) {
        console.error(`Error generating starter code for ${language}:`, error);
        return `// Could not generate starter code for ${language}`;
    }
};

export const generateLearningPathFromResume = async (resumeText: string, skills: Skill[]): Promise<Pick<LearningPath, 'title' | 'summary' | 'modules'>> => {
    const skillsString = skills.map(s => `${s.name} (${s.level})`).join(', ');

    const prompt = `
    Based on the following resume text and skill list, create a personalized learning path to help the user advance their career.
    The path should have a motivational title, a brief summary, and 5-7 logical, actionable modules.
    For each module, provide a title, a short description, and a realistic time estimate for completion (e.g., '1-2 hours').
    
    ---SKILLS---
    ${skillsString}

    ---RESUME---
    ${resumeText}
    ---END RESUME---

    Generate a response adhering to the JSON schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: learningPathSchema },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating learning path from resume:", error);
        throw new Error("Failed to generate a learning path from the provided resume.");
    }
};

export const generateRoleBasedRoadmap = async (currentRole: string, dreamRole: string, skills: Skill[]): Promise<Pick<LearningPath, 'title' | 'summary' | 'modules'>> => {
    const skillsString = skills.map(s => `${s.name} (${s.level})`).join(', ');
    const prompt = `
    You are an expert career coach at a large tech company. A user wants to transition from their current role of '${currentRole}' to their dream role of '${dreamRole}'.
    Their current skills are: ${skillsString}.
    Based on this, generate a personalized learning path to help them bridge the gap.
    The path should have a motivational title, a brief summary, and 5-7 logical, actionable modules with descriptions. The modules should focus on acquiring specific technical skills, concepts, and perhaps soft skills relevant for the new role.
    For each module, provide a title, a short description, and a realistic time estimate for completion (e.g., '1-2 hours').
    Generate a response adhering to the JSON schema.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: learningPathSchema },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating role-based roadmap:", error);
        throw new Error("Failed to generate a career roadmap.");
    }
};

export const generateModuleDetails = async (moduleTitle: string, moduleDescription: string): Promise<ModuleDetails> => {
    const prompt = `
    You are a programming instructor creating a deep-dive lesson for a learning module.
    Module Title: "${moduleTitle}"
    Module Description: "${moduleDescription}"

    Please provide a detailed explanation of the topic, a relevant code example (in a language like Python or JavaScript), and a real-world analogy to make the concept understandable.
    Your response must be in JSON format and adhere to the provided schema.
    `;
    const moduleDetailsSchema = {
        type: "OBJECT",
        properties: {
            explanation: { type: "STRING", description: "A detailed explanation of the module's topic." },
            codeExample: {
                type: "OBJECT",
                properties: {
                    language: { type: "STRING" },
                    code: { type: "STRING" }
                },
                required: ["language", "code"]
            },
            realWorldExample: { type: "STRING", description: "A relatable real-world analogy." }
        },
        required: ["explanation", "codeExample", "realWorldExample"]
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: moduleDetailsSchema },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating module details:", error);
        throw new Error("Failed to generate details for this module.");
    }
};

export const generateUserProgressInsights = async (user: UserProfile): Promise<ProgressInsights> => {
    const simplifiedProfile = {
        skills: user.skills,
        questionsSolved: user.questionsSolved,
        dreamRole: user.dreamRole,
        learningPaths: user.learningPaths?.map(p => ({
            title: p.title,
            modules: p.modules.map(m => ({ title: m.title, completed: m.completed }))
        })) || []
    };

    const simplifiedActivity = (user.activity || []).map(a => ({
        date: a.date,
        language: a.language,
        type: a.type,
        score: a.score
    })).slice(-30); // Last 30 activities to keep prompt concise

    const prompt = `
    Analyze the following user data from a coding platform and generate actionable insights. The user's name is ${user.name}.

    User Profile & Learning Goals:
    ${JSON.stringify(simplifiedProfile, null, 2)}

    Recent Activity (last 30 events):
    ${JSON.stringify(simplifiedActivity, null, 2)}

    Based on the data, provide insights adhering to the following JSON schema.
    - progressSummary: Summarize the user's progress and completion rate across their learning path modules.
    - languageAnalysis: Identify their most active programming languages and their performance trends (e.g., improving scores).
    - inactivityAnalysis: Highlight any significant inactive periods from their activity log and suggest a friendly re-engagement strategy.
    - nextSteps: Recommend the next 1-2 learning modules based on their incomplete paths and skill levels.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: progressInsightsSchema },
        });
        const result = JSON.parse(response.text.trim());
        return result as ProgressInsights;
    } catch (error) {
        console.error("Error generating progress insights with Gemini:", error);
        throw new Error("Failed to generate AI insights. Please try again.");
    }
};

export const evaluateSolution = async (question: ProgrammingQuestion, code: string, language: string): Promise<SolutionEvaluation> => {
    // First, run against test cases
    const testCaseResults = await evaluateCodeAgainstTestCases(code, language, question.testCases);

    if (testCaseResults.error) {
        return {
            testResults: testCaseResults.testResults || [],
            error: testCaseResults.error,
            timeComplexity: "N/A",
            spaceComplexity: "N/A",
            feedback: "Could not evaluate the solution due to a runtime error.",
        };
    }

    const prompt = `
    You are an expert code reviewer. A user has submitted a solution for the following problem in ${language}.
    
    --- PROBLEM ---
    Title: ${question.questionText}
    Description: ${question.description}

    --- USER'S CODE ---
    ${code}
    --- END CODE ---

    Please provide a detailed evaluation of the user's code. Analyze the following:
    1.  Time Complexity: What is the Big O time complexity?
    2.  Space Complexity: What is the Big O space complexity?
    3.  Feedback: Provide constructive feedback on the code's logic, correctness, and readability. Be encouraging.
    4.  Better Approach: If a significantly better approach exists (e.g., more optimal), briefly describe it. Otherwise, this MUST be omitted.

    Provide your response in JSON format according to the schema.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: solutionEvaluationSchema },
        });

        const analysis: Omit<SolutionEvaluation, 'testResults' | 'error'> = JSON.parse(response.text.trim());

        return {
            ...analysis,
            testResults: testCaseResults.testResults,
            error: testCaseResults.error,
        };

    } catch (error) {
        console.error("Error evaluating solution with Gemini:", error);
        return {
            testResults: testCaseResults.testResults,
            error: testCaseResults.error,
            timeComplexity: "N/A",
            spaceComplexity: "N/A",
            feedback: "An error occurred during AI analysis of the code.",
        };
    }
};

export const generateConceptQuestion = async (conceptTitle: string): Promise<Omit<ConceptQuestion, 'id'>> => {
    const prompt = `
    Generate a complete coding question for the concept: "${conceptTitle}".
    Your response must be in JSON and strictly adhere to the provided schema.
    The questionText must be comprehensive and include separate sections for 'Example 1', 'Example 2', and 'Constraints'.
    The similarQuestions should be names of other common coding problems.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: conceptQuestionSchema },
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error(`Error generating question for concept "${conceptTitle}":`, error);
        throw new Error(`Failed to generate a question for ${conceptTitle}.`);
    }
};

export const extractSkillsFromResumeText = async (resumeText: string): Promise<string[]> => {
    const prompt = `Analyze the following resume text and identify the key technical skills.
    Focus on programming languages, frameworks, libraries, databases, and cloud technologies.
    Extract a list of the 5 to 10 most prominent skills.

    ---RESUME TEXT---
    ${resumeText}
    ---END RESUME TEXT---

    Return the skills as a JSON array of strings.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: resumeSkillsSchema },
        });
        const result = JSON.parse(response.text.trim());
        return result.skills;
    } catch (error) {
        console.error("Error extracting skills from resume:", error);
        throw new Error("Failed to analyze skills from resume.");
    }
};

export const analyzeResumeText = async (resumeText: string): Promise<ResumeAnalysis> => {
    const prompt = `Analyze the following resume text and extract a professional summary, key technical skills, detailed work experience, and education history.
    Adhere strictly to the provided JSON schema. For dates, use YYYY-MM format. If a date is missing, use a placeholder like 'N/A'.

    ---RESUME TEXT---
    ${resumeText}
    ---END RESUME TEXT---
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: resumeAnalysisSchema },
        });
        const result = JSON.parse(response.text.trim());
        // Gemini might not include ids, so we add them.
        const resultWithIds = {
            ...result,
            workExperience: result.workExperience?.map((w: any) => ({ ...w, id: uuidv4() })) || [],
            education: result.education?.map((e: any) => ({ ...e, id: uuidv4() })) || [],
        };
        return resultWithIds;
    } catch (error) {
        console.error("Error analyzing resume with Gemini:", error);
        throw new Error("Failed to analyze resume with AI.");
    }
};
