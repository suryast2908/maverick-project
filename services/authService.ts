import firebase from 'firebase/compat/app';
import { auth, googleProvider, firestore, storage } from './firebase';
import { UserProfile, ProgressStatus, UserActivity, LearningPath, Skill } from '../types';
import { analyzeResumeText } from './geminiService';
import { extractTextFromPdfUrl } from '../utils/pdf';

type User = firebase.User;

// The UIDs of users who should have admin privileges, based on the custom claims script.
const ADMIN_UIDS = [
  "JTQUstJXTXgySxOMMrHaHrWUF1r2",
  "ExBeVWXT4CdTwSdo50fcY8GgK4V2"
];

// Helper function to normalize user profile data from Firestore, providing defaults for missing fields.
const normalizeUserProfile = (data: any, id: string): UserProfile => {
    const defaultProfile: Omit<UserProfile, 'id'> = {
        email: '',
        name: 'Unnamed User',
        avatar: `https://i.pravatar.cc/150?u=${id}`,
        skills: [],
        assessmentScore: 0,
        lastUpdated: 'N/A',
        progress: [],
        activity: [],
        needsOnboarding: false,
        headline: '',
        location: '',
        currentRole: 'Not specified',
        dreamRole: 'Not specified',
        githubUsername: '',
        resumeUrl: '',
        questionsSolved: 0,
        hackathonResults: [],
        claimedBadges: [],
        learningPaths: [],
        gender: 'Prefer not to say',
        dateOfBirth: '',
        bio: '',
        linkedinUrl: '',
        workExperience: [],
        education: [],
        resumeAnalysis: {},
        dailyMissionProgress: undefined,
        xp: 0,
        level: 1,
    };

    return {
        ...defaultProfile, // Start with all default values
        ...data,           // Override with any existing data from Firestore
        id: id,            // Ensure the ID is correctly set
    };
};


export const signInWithGoogle = async (): Promise<void> => {
    try {
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error("Error during sign-in:", error);
        throw error;
    }
};

export const signInWithEmailAndPassword = async (email: string, password: string): Promise<firebase.auth.UserCredential> => {
    try {
        return await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error("Error signing in with email and password:", error);
        throw error;
    }
};

export const signUpWithEmailAndPassword = async (name: string, email: string, password: string): Promise<firebase.auth.UserCredential> => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (userCredential.user) {
            await userCredential.user.updateProfile({
                displayName: name,
            });
            // onAuthStateChanged will handle profile creation via getOrCreateUserProfile
        }
        return userCredential;
    } catch (error) {
        console.error("Error signing up with email and password:", error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    try {
        return await auth.sendPasswordResetEmail(email);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

export const handleSignOut = async (): Promise<void> => {
    await auth.signOut();
};

export const getOrCreateUserProfile = async (user: User): Promise<{ profile: UserProfile, role: 'user' | 'admin' }> => {
    const idTokenResult = await user.getIdTokenResult();
    const isAdmin = idTokenResult.claims.admin === true;
    const role = isAdmin ? 'admin' : 'user';

    const userDocRef = firestore.collection('users').doc(user.uid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
        const profileData = userDocSnap.data() || {};
        const normalizedProfile = normalizeUserProfile(profileData, user.uid);
        return { profile: normalizedProfile, role };
    } else {
        // Role is determined by custom claim
        const newUserProfile: UserProfile = {
            id: user.uid,
            email: user.email || '',
            name: user.displayName || 'New Maverick',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            skills: [],
            assessmentScore: 0,
            lastUpdated: new Date().toLocaleDateString(),
            progress: [
                { name: "Profile Loaded", status: ProgressStatus.COMPLETED, timestamp: new Date().toLocaleString(), details: 'User account created.' },
                { name: "Assessment Completed", status: ProgressStatus.PENDING },
                { name: "Skills Evaluated", status: ProgressStatus.PENDING },
                { name: "Learning Path Generated", status: ProgressStatus.PENDING },
            ],
            activity: [],
            needsOnboarding: !isAdmin, // Admins don't need onboarding
            currentRole: 'Not specified',
            dreamRole: 'Not specified',
            questionsSolved: 0,
            hackathonResults: [],
            claimedBadges: [],
            learningPaths: [],
            workExperience: [],
            education: [],
            xp: 0,
            level: 1,
        };
        await userDocRef.set(newUserProfile);
        const normalizedProfile = normalizeUserProfile(newUserProfile, user.uid);
        return { profile: normalizedProfile, role };
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>, resumeFile: File | null): Promise<void> => {
    const dataToUpdate: Partial<UserProfile> = { ...data };

    if (resumeFile) {
        if (resumeFile.type !== 'application/pdf' || resumeFile.size > 5 * 1024 * 1024) {
            throw new Error('Resume must be a PDF file smaller than 5MB.');
        }
        const storageRef = storage.ref(`resumes/${uid}/resume.pdf`);
        try {
            await storageRef.put(resumeFile);
            const downloadURL = await storageRef.getDownloadURL();
            dataToUpdate.resumeUrl = downloadURL;

             // Start AI analysis after successful upload
            try {
                const resumeText = await extractTextFromPdfUrl(downloadURL);
                if (resumeText) {
                    const analysis = await analyzeResumeText(resumeText);
                    
                    // Scraped data fills the profile.
                    dataToUpdate.resumeAnalysis = analysis;
                    if (analysis.workExperience) dataToUpdate.workExperience = analysis.workExperience;
                    if (analysis.education) dataToUpdate.education = analysis.education;
                    
                    // Merge skills from resume with existing skills
                    if (analysis.extractedSkills) {
                        const existingSkills = new Set((data.skills || []).map(s => s.name.toLowerCase()));
                        const newSkills: Skill[] = analysis.extractedSkills
                            .filter(s => !existingSkills.has(s.toLowerCase()))
                            .map(s => ({ name: s, level: 'Intermediate', assessmentDifficulty: 'Intermediate' }));
                        dataToUpdate.skills = [...(data.skills || []), ...newSkills];
                    }
                }
            } catch (analysisError) {
                console.error("Failed to analyze resume during profile update:", analysisError);
                // Don't block the profile update if analysis fails. The resume URL is still saved.
            }

        } catch (error) {
            console.error("Error uploading resume:", error);
            throw error;
        }
    }
    
    // Always mark onboarding as complete when this function is called from registration
    if (data.hasOwnProperty('headline')) {
      dataToUpdate.needsOnboarding = false;
    }
    dataToUpdate.lastUpdated = new Date().toLocaleDateString();

    const userDocRef = firestore.collection('users').doc(uid);
    await userDocRef.update(dataToUpdate);
};

export const addLearningPath = async (uid: string, path: LearningPath): Promise<void> => {
    const userDocRef = firestore.collection('users').doc(uid);
    await userDocRef.update({
        learningPaths: firebase.firestore.FieldValue.arrayUnion(path)
    });
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersCollection = firestore.collection('users');
    const querySnapshot = await usersCollection.get();
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out admin users from the general user list by their UID
        if (!ADMIN_UIDS.includes(doc.id)) {
            const normalizedProfile = normalizeUserProfile(data, doc.id);
            users.push(normalizedProfile);
        }
    });
    return users;
};

export const getUserProfileById = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = firestore.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    if (userDocSnap.exists) {
        const data = userDocSnap.data() || {};
        return normalizeUserProfile(data, uid);
    }
    return null;
}

/**
 * Submits a quiz result for a user, updating their activity log, solved count,
 * and conditionally updating the leaderboard if the score is high enough.
 * @param userId - The UID of the user.
 * @param score - The score the user achieved on the quiz.
 * @param language - The programming language of the quiz.
 * @param avatar - The user's avatar URL (note: the avatar from the user's profile is used for consistency).
 */
export const submitQuiz = async (
    userId: string,
    score: number,
    language: string,
    avatar: string
): Promise<void> => {
    const userDocRef = firestore.collection('users').doc(userId);

    try {
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            console.error(`User document for ${userId} not found. Cannot submit quiz.`);
            throw new Error("User profile not found.");
        }
        const userData = userDoc.data() as UserProfile;

        // Create the new activity object with all required fields
        const newActivity: UserActivity = {
            date: new Date().toISOString(),
            type: "quiz",
            language: language,
            score: score,
            assessmentScore: score,
            avatar: userData.avatar,
        };

        // Format date as DD/MM/YYYY for the lastUpdated field
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        // Update the main user document
        await userDocRef.update({
            activity: firebase.firestore.FieldValue.arrayUnion(newActivity),
            questionsSolved: firebase.firestore.FieldValue.increment(1),
            assessmentScore: score,
            lastUpdated: formattedDate,
        });
        console.log(`Successfully updated activity for user ${userId}.`);
        
        // Conditionally update the leaderboard if the score is 60 or higher
        if (score >= 60) {
            const leaderboardDocRef = firestore.collection('leaderboard').doc(userId);
            const leaderboardData = {
                name: userData.name,
                avatar: userData.avatar,
                latestScore: score,
                questionsSolved: firebase.firestore.FieldValue.increment(1),
            };
            // Use set with merge:true to create or update the leaderboard document
            await leaderboardDocRef.set(leaderboardData, { merge: true });
            console.log(`Leaderboard updated for user ${userId}.`);
        }
    } catch (error) {
        console.error(`Error submitting quiz for user ${userId}:`, error);
        throw error;
    }
};

export const deleteUser = async (uid: string): Promise<void> => {
    const userDocRef = firestore.collection('users').doc(uid);
    try {
        await userDocRef.delete();
        // NOTE: This does not delete the user from Firebase Authentication,
        // as that is a privileged operation that requires a backend function.
        // This only removes their data from the application's database.
    } catch (error) {
        console.error("Error deleting user document:", error);
        throw new Error("Could not delete user data.");
    }
};
