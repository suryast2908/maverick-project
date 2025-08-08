import { firestore } from './firebase';
import { ProgrammingQuestion, QuestionType, SolutionEvaluation } from '../types';
import { generateDailyMission, generateStarterCodeForMission, evaluateCodeAgainstTestCases, evaluateSolution as evaluateSolutionWithGemini } from './geminiService';

// Type for the Firestore document to cache the mission
interface DailyMissionDoc {
    questionText: string;
    description: string;
    constraints: string[];
    testCases: ProgrammingQuestion['testCases'];
    starterCodes: { [language: string]: string };
}

const programmingLanguages = [
    "JavaScript", "Python", "Java", "C#", "TypeScript", "C++", "PHP", "Go",
    "Ruby", "Swift", "Kotlin", "Rust", "SQL"
];


/**
 * Gets the daily mission for a given date string.
 * It first checks for a cached version in Firestore.
 * - If the mission exists and has the requested language's starter code, it returns it.
 * - If the mission exists but not the starter code, it generates only the starter code and adds it to the cache.
 * - If the mission does not exist, it generates a new one, caches it for all languages, and returns it.
 */
export const getOrGenerateDailyMission = async (dateString: string, language: string): Promise<ProgrammingQuestion> => {
    const missionDocRef = firestore.collection('dailyMissions').doc(dateString);
    const missionDocSnap = await missionDocRef.get();

    if (missionDocSnap.exists) {
        // Mission for today exists in cache
        const data = missionDocSnap.data() as DailyMissionDoc;

        if (data.starterCodes && data.starterCodes[language]) {
            // Language-specific starter code also exists in cache
            return {
                type: QuestionType.PROGRAMMING,
                questionText: data.questionText,
                description: data.description,
                constraints: data.constraints,
                testCases: data.testCases,
                starterCode: data.starterCodes[language],
            };
        } else {
            // Mission exists, but not for this language. Generate starter code and update cache.
            const baseQuestion = {
                questionText: data.questionText,
                description: data.description,
                constraints: data.constraints,
                testCases: data.testCases,
            };
            const newStarterCode = await generateStarterCodeForMission(baseQuestion, language);
            
            // Update Firestore with the new starter code
            await missionDocRef.update({
                [`starterCodes.${language}`]: newStarterCode,
            });

            return {
                ...baseQuestion,
                type: QuestionType.PROGRAMMING,
                starterCode: newStarterCode,
            };
        }
    } else {
        // No mission for today in cache, generate a new one for all languages
        console.log(`Generating new mission for ${dateString} and caching all languages.`);
        const newQuestion = await generateDailyMission(dateString, language);

        // Deconstruct to store in Firestore-friendly format
        const { starterCode, type, ...baseQuestion } = newQuestion;

        const starterCodes: { [language: string]: string } = {
            [language]: starterCode,
        };

        // Generate starter code for all other languages
        const otherLanguages = programmingLanguages.filter(l => l !== language);
        const starterCodePromises = otherLanguages.map(lang => 
            generateStarterCodeForMission(baseQuestion, lang)
              .then(code => ({ lang, code }))
              .catch(err => {
                  console.error(`Failed to generate starter code for ${lang}:`, err);
                  return null; // return null on failure
              })
        );
        
        const results = await Promise.all(starterCodePromises);
        results.forEach(result => {
            if (result) {
                starterCodes[result.lang] = result.code;
            }
        });

        const docPayload: DailyMissionDoc = {
            ...baseQuestion,
            starterCodes,
        };

        await missionDocRef.set(docPayload);

        return newQuestion;
    }
};

/**
 * Runs the user's code against only the visible test cases for a quick check.
 */
export const runMissionCode = async (code: string, language: string, question: ProgrammingQuestion) => {
    const visibleTestCases = question.testCases.filter(tc => !tc.hidden);
    return await evaluateCodeAgainstTestCases(code, language, visibleTestCases);
};

/**
 * Provides a full evaluation of a user's solution for a given problem.
 */
export const evaluateSolution = async (question: ProgrammingQuestion, code: string, language: string): Promise<SolutionEvaluation> => {
    return await evaluateSolutionWithGemini(question, code, language);
};
