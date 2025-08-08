import { firestore, serverTimestamp } from './firebase';
import { ConceptQuestion, ConceptAttempt } from '../types';
import { generateConceptQuestion } from './geminiService';
import { evaluateCodeAgainstTestCases } from './geminiService';

const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

export const getQuestionForConcept = async (conceptTitle: string): Promise<ConceptQuestion> => {
    const slug = toSlug(conceptTitle);
    const docRef = firestore.collection('questions').doc(slug);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        console.log(`Question for "${conceptTitle}" found in cache.`);
        return docSnap.data() as ConceptQuestion;
    } else {
        console.log(`Question for "${conceptTitle}" not in cache. Generating with Gemini...`);
        const questionData = await generateConceptQuestion(conceptTitle);
        const fullQuestion: ConceptQuestion = {
            id: slug,
            ...questionData,
        };
        await docRef.set(fullQuestion);
        console.log(`Question for "${conceptTitle}" cached in Firestore.`);
        return fullQuestion;
    }
};

export const runConceptCode = async (code: string, language: string, testCases: ConceptQuestion['testCases']) => {
    return await evaluateCodeAgainstTestCases(code, language, testCases);
};

export const submitConceptAttempt = async (attemptData: Omit<ConceptAttempt, 'id' | 'timestamp'>): Promise<string> => {
    const attemptWithTimestamp = {
        ...attemptData,
        timestamp: serverTimestamp()
    };
    const docRef = await firestore.collection('conceptAttempts').add(attemptWithTimestamp);
    return docRef.id;
};