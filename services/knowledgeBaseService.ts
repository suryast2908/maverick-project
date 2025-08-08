
import { firestore, serverTimestamp } from './firebase';
import { KnowledgeDocument } from '../types';

const knowledgeCollection = firestore.collection('knowledge');

export const getKnowledgeDocuments = async (): Promise<KnowledgeDocument[]> => {
    const q = knowledgeCollection.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    const documents: KnowledgeDocument[] = [];
    querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() } as KnowledgeDocument);
    });
    return documents;
};

export const addKnowledgeDocument = async (title: string, content: string): Promise<KnowledgeDocument> => {
    const docRef = await knowledgeCollection.add({
        title,
        content,
        createdAt: serverTimestamp(),
    });
    return {
        id: docRef.id,
        title,
        content,
        createdAt: new Date().toISOString(), // Return an optimistic value
    };
};

export const removeKnowledgeDocument = async (id: string): Promise<void> => {
    const docRef = firestore.collection('knowledge').doc(id);
    await docRef.delete();
};
