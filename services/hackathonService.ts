import firebase from 'firebase/compat/app';
import { firestore, serverTimestamp } from './firebase';
import { HackathonRequest, Hackathon, ProblemStatement } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Submit a hackathon request
 */
export const requestHackathon = async (
    userId: string,
    userName: string,
    userEmail: string,
    requestText: string
): Promise<void> => {
    if (!requestText.trim()) {
        throw new Error("Request text cannot be empty.");
    }
    await firestore.collection('hackathonRequests').add({
        userId,
        userName,
        userEmail,
        requestText,
        timestamp: serverTimestamp(),
        status: 'pending',
    });
};

/**
 * Get all hackathon requests for an admin.
 */
export const getHackathonRequests = async (): Promise<HackathonRequest[]> => {
    // Admin can fetch all requests
    const snapshot = await firestore.collection('hackathonRequests')
        .orderBy('timestamp', 'desc')
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HackathonRequest));
};

/**
 * Get requests by a specific user
 */
export const getRequestsByUser = async (userId: string): Promise<HackathonRequest[]> => {
    const snapshot = await firestore.collection('hackathonRequests')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HackathonRequest));
};

/**
 * Update hackathon request status
 */
export const updateHackathonRequestStatus = async (
    requestId: string,
    status: 'approved' | 'rejected',
    hackathonId?: string
): Promise<void> => {
    const dataToUpdate: { status: 'approved' | 'rejected'; hackathonId?: string } = { status };
    if (status === 'approved' && hackathonId) {
        dataToUpdate.hackathonId = hackathonId;
    }
    await firestore.collection('hackathonRequests').doc(requestId).update(dataToUpdate);
};

/**
 * Create a new hackathon
 */
export const createHackathon = async (hackathonData: Omit<Hackathon, 'id' | 'status'>): Promise<string> => {
    const status = hackathonData.startDate > new Date() ? 'Upcoming' : 'Ongoing';
    const docRef = await firestore.collection('hackathons').add({
        ...hackathonData,
        status,
    });
    return docRef.id;
};


/**
 * Get all hackathons
 */
export const getHackathons = async (): Promise<Hackathon[]> => {
    const snapshot = await firestore.collection('hackathons')
        .orderBy('startDate', 'desc')
        .get();
        
    const hackathons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hackathon));
    
    // Add a default mock hackathon if none exist, for demonstration purposes
    if (hackathons.length === 0) {
        const today = new Date();
        const mockHackathon: Hackathon = {
            id: 'mock-1',
            title: 'AI for Social Good',
            description: 'Develop an innovative AI solution to tackle pressing social and environmental issues. Join us to code for a better world!',
            startDate: firebase.firestore.Timestamp.fromDate(new Date(today.setDate(today.getDate() + 7))),
            endDate: firebase.firestore.Timestamp.fromDate(new Date(today.setDate(today.getDate() + 9))),
            status: 'Upcoming',
            bannerUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2006&auto=format&fit=crop',
            logoUrl: 'https://example.com/logo.png', // Replace with a real logo if available
            rules: [
                'Teams can have 1-4 members.',
                'All code must be written during the hackathon.',
                'Projects will be judged on innovation, impact, and technical execution.',
                'Submissions must include a link to a public GitHub repository.',
            ],
            prizes: [
                '1st Place: $5,000 cash prize + Internship interviews',
                '2nd Place: $2,500 cash prize + High-end tech swag',
                '3rd Place: $1,000 cash prize',
            ],
            problemStatements: [
                { id: uuidv4(), title: 'Health Access AI', description: 'Create a tool to help underserved communities find and access healthcare resources.', difficulty: 'Hard', tags: ['Healthcare', 'AI/ML', 'Geolocation'] },
                { id: uuidv4(), title: 'Climate Change Monitor', description: 'Build a dashboard to visualize and analyze real-time climate data to raise awareness.', difficulty: 'Medium', tags: ['Data Science', 'Environment', 'Web Dev'] },
                { id: uuidv4(), title: 'Education Equity Bot', description: 'Design a chatbot to provide personalized learning support for students in need.', difficulty: 'Medium', tags: ['NLP', 'Education', 'Chatbot'] },
            ],
        };
        hackathons.push(mockHackathon);
    }
    
    return hackathons;
};