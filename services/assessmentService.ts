

import { firestore, serverTimestamp } from './firebase';
import { StoredAssessmentResult, QuizConfig, AssessmentConfig, EvaluationResult, CustomAssessment } from '../types';

export const saveAssessmentResult = async (userId: string, config: AssessmentConfig | QuizConfig, result: EvaluationResult): Promise<string> => {
    const docRef = await firestore.collection('assessmentResults').add({
        userId,
        config,
        result,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAssessmentResult = async (resultId: string): Promise<StoredAssessmentResult | null> => {
    const docRef = firestore.collection('assessmentResults').doc(resultId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() } as StoredAssessmentResult;
    }
    return null;
};

export const createCustomAssessment = async (assessmentData: Omit<CustomAssessment, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await firestore.collection('customAssessments').add({
        ...assessmentData,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAssignedAssessmentsForUser = async (userId: string): Promise<CustomAssessment[]> => {
    const exampleAssessment: CustomAssessment = {
        id: 'example-assessment-1',
        creatorId: 'mavericks-platform',
        createdAt: new Date(),
        title: "Frontend Skill Test (Example)",
        description: "A brief summary of what this assessment covers, including HTML, CSS, and basic JavaScript.",
        tags: ["JavaScript", "React", "SQL"],
        timeLimit: 60,
        difficulty: 'Medium',
        instructions: "Read each question carefully. You cannot go back to previous questions. Good luck!",
        scoringPattern: "10 points per question. No negative marking.",
        showLeaderboard: true,
        config: {
            type: 'quiz',
            language: 'JavaScript',
            difficulty: 'Intermediate',
            numberOfQuestions: 12,
            numberOfProgrammingQuestions: 2,
            customTopic: 'Frontend Fundamentals'
        },
        assignees: {
            type: 'ALL_USERS',
            userIds: []
        }
    };

    try {
        const allUsersQuery = firestore.collection('customAssessments')
            .where('assignees.type', '==', 'ALL_USERS');
        
        const specificUserQuery = firestore.collection('customAssessments')
            .where('assignees.type', '==', 'SPECIFIC_USERS')
            .where('assignees.userIds', 'array-contains', userId);

        const [allUsersSnapshot, specificUserSnapshot] = await Promise.all([
            allUsersQuery.get(),
            specificUserQuery.get()
        ]);

        const assessmentsMap = new Map<string, CustomAssessment>();

        allUsersSnapshot.forEach(doc => {
            assessmentsMap.set(doc.id, { id: doc.id, ...doc.data() } as CustomAssessment);
        });

        specificUserSnapshot.forEach(doc => {
            assessmentsMap.set(doc.id, { id: doc.id, ...doc.data() } as CustomAssessment);
        });
        
        const assessments = Array.from(assessmentsMap.values());
        
        // Prepend the example assessment to the list
        assessments.unshift(exampleAssessment);

        return assessments.sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) - (a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt));

    } catch (error) {
        console.error("Error fetching assigned assessments:", error);
        // On error, still return the example assessment so the UI doesn't break
        return [exampleAssessment];
    }
};