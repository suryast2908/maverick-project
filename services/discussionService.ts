

import firebase from 'firebase/compat/app';
import { firestore, serverTimestamp } from './firebase';
import { DiscussionThread, DiscussionReply, DiscussionCategory, DiscussionDifficulty, DiscussionStatus, DiscussionLanguage } from '../types';

export const createThread = async (threadData: Omit<DiscussionThread, 'id' | 'timestamp' | 'replyCount' | 'upvotes' | 'downvotes' | 'upvotedBy' | 'downvotedBy' | 'repliedBy'>): Promise<string> => {
  const docRef = await firestore.collection('discussions').add({
    ...threadData,
    replyCount: 0,
    timestamp: serverTimestamp(),
    upvotes: 0,
    downvotes: 0,
    upvotedBy: [],
    downvotedBy: [],
    repliedBy: [],
  });
  return docRef.id;
};

export interface GetThreadsFilters {
    category: 'All Categories' | DiscussionCategory;
    language: 'All Languages' | DiscussionLanguage;
    difficulty: 'All Levels' | DiscussionDifficulty;
    status: 'All Posts' | DiscussionStatus;
    sortBy: 'Newest' | 'Top' | 'Most Replies';
    scope: 'All Threads' | 'My Threads' | 'My Replies';
}

export const getThreads = async (filters: GetThreadsFilters, userId: string): Promise<DiscussionThread[]> => {
    let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('discussions');

    if (filters.scope === 'My Threads') {
      query = query.where('authorId', '==', userId);
    }
    if (filters.scope === 'My Replies') {
      query = query.where('repliedBy', 'array-contains', userId);
    }
    if (filters.category !== 'All Categories') {
        query = query.where('category', '==', filters.category);
    }
    if (filters.language !== 'All Languages') {
        query = query.where('language', '==', filters.language);
    }
    if (filters.difficulty !== 'All Levels') {
        query = query.where('difficulty', '==', filters.difficulty);
    }
    if (filters.status !== 'All Posts') {
        query = query.where('status', '==', filters.status);
    }

    if (filters.sortBy === 'Top') {
      query = query.orderBy('upvotes', 'desc');
    } else if (filters.sortBy === 'Most Replies') {
        query = query.orderBy('replyCount', 'desc');
    } else { // 'Newest' and 'Most Popular' (not implemented) default to newest
        query = query.orderBy('timestamp', 'desc');
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiscussionThread));
};

export const getThreadWithReplies = async (threadId: string): Promise<{ thread: DiscussionThread; replies: DiscussionReply[] } | null> => {
    const threadRef = firestore.collection('discussions').doc(threadId);
    const threadSnap = await threadRef.get();

    if (!threadSnap.exists) {
        return null;
    }

    const repliesRef = threadRef.collection('replies').orderBy('timestamp', 'asc');
    const repliesSnap = await repliesRef.get();

    const thread = { id: threadSnap.id, ...threadSnap.data() } as DiscussionThread;
    const replies = repliesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiscussionReply));

    return { thread, replies };
};

export const addReply = async (threadId: string, replyData: Omit<DiscussionReply, 'id' | 'timestamp' | 'upvotes' | 'downvotes' | 'upvotedBy' | 'downvotedBy'>): Promise<void> => {
    const threadRef = firestore.collection('discussions').doc(threadId);
    const replyRef = threadRef.collection('replies').doc();

    const transaction = firestore.runTransaction(async (t) => {
        t.set(replyRef, {
            ...replyData,
            timestamp: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
            upvotedBy: [],
            downvotedBy: [],
        });
        t.update(threadRef, {
            replyCount: firebase.firestore.FieldValue.increment(1),
            repliedBy: firebase.firestore.FieldValue.arrayUnion(replyData.authorId),
        });
    });

    await transaction;
};

export const deleteThread = async (threadId: string): Promise<void> => {
  const threadRef = firestore.collection('discussions').doc(threadId);
  const repliesRef = threadRef.collection('replies');
  
  const batch = firestore.batch();

  // Delete all replies in the subcollection
  const repliesSnapshot = await repliesRef.get();
  repliesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Delete the thread itself
  batch.delete(threadRef);
  
  await batch.commit();
};

export const deleteReply = async (threadId: string, replyId: string): Promise<void> => {
  const threadRef = firestore.collection('discussions').doc(threadId);
  const replyRef = threadRef.collection('replies').doc(replyId);
  
  const transaction = firestore.runTransaction(async (t) => {
    const threadDoc = await t.get(threadRef);
    if (threadDoc.exists) {
        t.delete(replyRef);
        const currentCount = threadDoc.data()?.replyCount || 0;
        if (currentCount > 0) {
            t.update(threadRef, { replyCount: firebase.firestore.FieldValue.increment(-1) });
        }
    } else {
        t.delete(replyRef);
    }
  });

  await transaction;
};

const handleVote = async (docRef: firebase.firestore.DocumentReference, userId: string, voteType: 'up' | 'down') => {
  await firestore.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) return;

      const data = doc.data() as { upvotedBy: string[], downvotedBy: string[], upvotes: number, downvotes: number };
      const upvotedBy = data.upvotedBy || [];
      const downvotedBy = data.downvotedBy || [];

      const isUpvoted = upvotedBy.includes(userId);
      const isDownvoted = downvotedBy.includes(userId);

      const updates: { [key: string]: any } = {};

      if (voteType === 'up') {
          if (isUpvoted) {
              updates.upvotedBy = firebase.firestore.FieldValue.arrayRemove(userId);
              updates.upvotes = firebase.firestore.FieldValue.increment(-1);
          } else {
              updates.upvotedBy = firebase.firestore.FieldValue.arrayUnion(userId);
              updates.upvotes = firebase.firestore.FieldValue.increment(1);
              if (isDownvoted) {
                  updates.downvotedBy = firebase.firestore.FieldValue.arrayRemove(userId);
                  updates.downvotes = firebase.firestore.FieldValue.increment(-1);
              }
          }
      } else { // voteType === 'down'
          if (isDownvoted) {
              updates.downvotedBy = firebase.firestore.FieldValue.arrayRemove(userId);
              updates.downvotes = firebase.firestore.FieldValue.increment(-1);
          } else {
              updates.downvotedBy = firebase.firestore.FieldValue.arrayUnion(userId);
              updates.downvotes = firebase.firestore.FieldValue.increment(1);
              if (isUpvoted) {
                  updates.upvotedBy = firebase.firestore.FieldValue.arrayRemove(userId);
                  updates.upvotes = firebase.firestore.FieldValue.increment(-1);
              }
          }
      }
      t.update(docRef, updates);
  });
};

export const voteOnThread = async (threadId: string, userId: string, voteType: 'up' | 'down'): Promise<void> => {
  const threadRef = firestore.collection('discussions').doc(threadId);
  await handleVote(threadRef, userId, voteType);
};

export const voteOnReply = async (threadId: string, replyId: string, userId: string, voteType: 'up' | 'down'): Promise<void> => {
  const replyRef = firestore.collection('discussions').doc(threadId).collection('replies').doc(replyId);
  await handleVote(replyRef, userId, voteType);
};
