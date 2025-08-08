import { UserProfile, LearningPath, LearningPathModule } from '../types';
import { extractTextFromPdfUrl } from '../utils/pdf';
import { generateLearningPathFromResume } from './geminiService';
import { addLearningPath } from './authService';
import { v4 as uuidv4 } from 'uuid';

export const createAndSaveLearningPath = async (user: UserProfile): Promise<LearningPath> => {
    if (!user.resumeUrl) {
        throw new Error("User has not uploaded a resume. Cannot generate a learning path.");
    }

    // 1. Extract text from resume
    const resumeText = await extractTextFromPdfUrl(user.resumeUrl);

    if (!resumeText.trim()) {
        throw new Error("Could not extract any text from the resume PDF.");
    }
    
    // 2. Generate content from Gemini
    const generatedContent = await generateLearningPathFromResume(resumeText, user.skills);
    
    // 3. Assemble the full LearningPath object
    const newLearningPath: LearningPath = {
        id: uuidv4(),
        generatedAt: new Date().toISOString(),
        title: generatedContent.title,
        summary: generatedContent.summary,
        modules: generatedContent.modules.map(mod => ({
            ...mod,
            id: uuidv4(),
            completed: false
        }))
    };
    
    // 4. Save to user's profile in Firestore (This is now handled by onUpdateUser in App.tsx)
    // await addLearningPath(user.id, newLearningPath);

    return newLearningPath;
};
