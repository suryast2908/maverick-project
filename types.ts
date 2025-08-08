



export enum ProgressStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending',
}

export interface ProgressStep {
  name: string;
  status: ProgressStatus;
  timestamp?: string;
  details?: string;
}

export interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export interface Hackathon {
    id: string; // Firestore document ID
    title: string;
    description: string;
    startDate: any; // Firestore Timestamp
    endDate: any; // Firestore Timestamp
    status: 'Upcoming' | 'Ongoing' | 'Completed';
    bannerUrl: string;
    logoUrl: string;
    rules: string[];
    prizes: string[];
    problemStatements: ProblemStatement[];
}

export interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string;
}

export interface UserActivity {
    type: 'assessment' | 'quiz' | 'playground';
    language: string;
    score?: number; // for assessment/quiz
    date: string;
    assessmentScore?: number;
    avatar?: string;
    resultId?: string;
}

export type SkillLevel = 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
export type AssessmentDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Skill {
  name: string;
  level: SkillLevel;
  assessmentDifficulty: AssessmentDifficulty;
}

export interface HackathonResult {
    hackathonTitle: string;
    rank?: number;
    status: 'Participated' | 'Winner' | 'Top 10';
    date: string;
}

// New type for AI-generated deep dive content for a module
export interface ModuleDetails {
    explanation: string;
    codeExample: {
        language: string;
        code: string;
    };
    realWorldExample: string;
}

export interface LearningPathModule {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    details?: ModuleDetails; // Add this optional field
    estimatedTime?: string;
}

export interface LearningPath {
    id:string;
    title: string;
    summary: string;
    modules: LearningPathModule[];
    generatedAt: string; // ISO string
}

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  startDate: string; // e.g., 'YYYY-MM'
  endDate: string;   // e.g., 'YYYY-MM' or 'Present'
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string; // e.g., 'YYYY-MM'
  endDate: string;   // e.g., 'YYYY-MM'
  description: string;
}

export interface ResumeAnalysis {
    summary?: string;
    extractedSkills?: string[];
    workExperience?: WorkExperience[];
    education?: Education[];
}

export interface UserProfile {
  id: string; // Changed from number to string for Firebase UID
  email: string;
  name:string;
  avatar: string;
  skills: Skill[];
  assessmentScore: number;
  lastUpdated: string;
  progress: ProgressStep[];
  activity: UserActivity[];
  dailyMissionProgress?: {
      date: string; // YYYY-MM-DD
      language: string;
      code: string;
      completed: boolean;
  };
  // New fields for registration
  needsOnboarding: boolean;
  headline?: string;
  location?: string;
  currentRole?: string;
  dreamRole?: string;
  githubUsername?: string;
  resumeUrl?: string;

  // New fields for Leaderboard & Achievements
  questionsSolved?: number;
  hackathonResults?: HackathonResult[];
  claimedBadges?: string[];

  // New field for personalized learning
  learningPaths?: LearningPath[];

  // New detailed profile fields
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  dateOfBirth?: string; // YYYY-MM-DD
  bio?: string;
  linkedinUrl?: string;
  workExperience?: WorkExperience[];
  education?: Education[];
  resumeAnalysis?: ResumeAnalysis; // Store AI-extracted data here
  
  // New fields for gamification
  xp?: number;
  level?: number;
}

export interface AssessmentConfig {
    type: 'assessment';
    language: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    numberOfQuestions: number;
    customTopic?: string;
}

export interface QuizConfig {
    type: 'quiz';
    language: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    numberOfQuestions: number;
    numberOfProgrammingQuestions: number;
    customTopic?: string;
}

// New type for custom assessments created by admins
export interface CustomAssessment {
  id: string;
  creatorId: string;
  createdAt: any; // Firestore Timestamp
  
  title: string;
  description: string;
  tags: string[];
  timeLimit: number; // minutes
  startDate?: any; // Firestore Timestamp
  endDate?: any; // Firestore Timestamp
  difficulty: 'Easy' | 'Medium' | 'Hard';
  
  instructions: string;
  scoringPattern: string;
  showLeaderboard: boolean;
  
  config: QuizConfig;

  assignees: {
    type: 'ALL_USERS' | 'SPECIFIC_USERS';
    userIds: string[]; // empty if type is ALL_USERS
  }
}

// New types for Assessment
export enum QuestionType {
    MCQ = "MCQ",
    PROGRAMMING = "PROGRAMMING",
}

export interface MCQQuestion {
  type: QuestionType.MCQ;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface ProgrammingQuestion {
    id?: string;
    type: QuestionType.PROGRAMMING;
    questionText: string; // Title of the problem
    description: string; // Full problem description
    constraints: string[];
    starterCode?: string; // For single-language contexts like daily mission
    starterCodes?: { [language: string]: string; }; // For multi-language contexts
    testCases: {
        input: string;
        expectedOutput: string;
        hidden: boolean;
    }[];
    // Company-specific fields
    company?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    topics?: string[];
}


export type AssessmentQuestion = MCQQuestion | ProgrammingQuestion;


export interface UserAnswer {
    questionIndex: number;
    answerIndex?: number; // For MCQ
    code?: string; // For Programming
    passed_tests?: number;
}

// New type for detailed programming question evaluation
export interface ProgrammingEvaluationCriteria {
    correctness: { score: number; feedback: string; };
    timeComplexity: { score: number; feedback: string; };
    dataStructures: { score: number; feedback: string; };
    spaceComplexity: { score: number; feedback: string; };
    logicSimplicity: { score: number; feedback: string; };
    totalScore?: number; // Calculated after fetching from Gemini
    overallFeedback?: string; // Calculated after fetching from Gemini
}

export interface DetailedEvaluationResult {
    questionText: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
    programmingEvaluation?: ProgrammingEvaluationCriteria;
    correctAnswerText?: string;
    correctCodeSolution?: string;
}

export interface EvaluationResult {
    score: number; // e.g. 80
    feedback: string; // "Good job on React hooks, but you should review state management."
    detailedResults: DetailedEvaluationResult[];
}

export interface StoredAssessmentResult {
    id: string;
    userId: string;
    createdAt: any; // Firestore Timestamp
    config: AssessmentConfig | QuizConfig;
    result: EvaluationResult;
}

export interface CodeExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    testResults?: {
        passed: boolean;
        input: string;
        output: string;
        expected: string;
    }[];
}

// New type for RAG knowledge base
export interface KnowledgeDocument {
    id: string;
    title: string;
    content: string;
    createdAt: any; // Allow for Firestore Timestamp
}

// New types for Interactive Tutor
export type TutorPace = 'Beginner' | 'Intermediate' | 'Advanced';

export interface TutorContent {
    subTopicTitle: string;
    explanation: string;
    codeExample: {
        language: string;
        code: string;
    };
    realWorldExample: string;
    isFinished: boolean;
    nextTopicSuggestion?: string;
}

// New Types for AI for Good Challenge
export interface ChallengeQuestion extends ProgrammingQuestion {
    // Inherits from ProgrammingQuestion, can add challenge-specific fields if needed
}

export interface ChallengeEvaluationResult {
    testCaseResults: CodeExecutionResult;
    logicalThinkingAnalysis: string; // AI-generated feedback on the user's logic
}

export interface CompanyQuestion {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  company: string;
  topics: string[];
}

// New types for Company Question "Learn" and "Solve" features
export interface LearnApproach {
    title: string;
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: string;
}

export interface SolutionEvaluation {
    testResults: {
        passed: boolean;
        input: string;
        output: string;
        expected: string;
    }[];
    error?: string;
    timeComplexity: string;
    spaceComplexity: string;
    feedback: string;
    betterApproachSuggestion?: string;
}

// New type for AI-generated progress insights
export interface ProgressInsights {
    progressSummary: string;
    languageAnalysis: string;
    inactivityAnalysis: string;
    nextSteps: string;
}

// New type for Hackathon Requests
export interface HackathonRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestText: string;
  timestamp: any; // Firestore Timestamp
  status: 'pending' | 'approved' | 'rejected';
  hackathonId?: string; // Link to the created hackathon event
}

// New types for "Select Your Concept" feature
export interface ConceptListItem {
    id: string; // slug
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topics: string[];
}

export interface ConceptQuestion {
  id: string; // slug
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptanceRate: string; // e.g., "55.5%"
  topics: string[];
  questionText: string; // The full problem statement with examples and examples and constraints
  similarQuestions: string[]; // Array of concept titles
  testCases: {
      input: string;
      expectedOutput: string;
      hidden: boolean;
  }[];
}

export interface ConceptAttempt {
    id?: string;
    userId: string;
    conceptId: string; // slug of the concept
    timeTaken: number; // in seconds
    solved: boolean;
    timestamp: any; // Firestore timestamp
    code: string;
}

// New types for Discussion Forum
export type DiscussionCategory = 'Questions' | 'Discussions' | 'Help' | 'Tutorials' | 'General';
export type DiscussionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type DiscussionStatus = 'Unsolved' | 'Solved';
export type DiscussionLanguage = 'JavaScript' | 'Python' | 'Java' | 'C++' | string; // etc.

export interface DiscussionThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  category: DiscussionCategory;
  language: DiscussionLanguage;
  difficulty: DiscussionDifficulty;
  status: DiscussionStatus;
  timestamp: any; // Firestore Timestamp
  replyCount: number;
  tags?: string[];
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  repliedBy: string[];
}

export interface DiscussionReply {
  id: string;
  threadId: string;
  authorId: string;
  authorName:string;
  authorAvatar: string;
  content: string;
  timestamp: any; // Firestore Timestamp
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
}

// New type for Notifications
export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'admin_request' | 'badge_unlocked' | 'system_update';
    isRead: boolean;
    createdAt: any; // Firestore Timestamp
}
