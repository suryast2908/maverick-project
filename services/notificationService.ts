
import { firestore, serverTimestamp } from './firebase';
import { Notification } from '../types';

export const createNotification = async (userId: string, message: string, type: Notification['type']): Promise<void> => {
  const notificationsRef = firestore.collection('notifications');

  await firestore.runTransaction(async (transaction) => {
      // Query for existing notifications for the user, oldest first
      const userNotificationsQuery = notificationsRef
          .where('userId', '==', userId)
          .orderBy('createdAt', 'asc');

      // Perform a non-transactional read to get the documents to delete.
      // This is a common client-side pattern to work around the lack of query support in transactions.
      const snapshot = await userNotificationsQuery.get();

      // Add the new notification
      const newNotificationRef = notificationsRef.doc();
      transaction.set(newNotificationRef, {
          userId,
          message,
          type,
          isRead: false,
          createdAt: serverTimestamp(),
      });

      // If there will be more than 5 notifications after adding the new one,
      // delete the oldest ones to maintain a limit of 5.
      const MAX_NOTIFICATIONS = 5;
      if (snapshot.size >= MAX_NOTIFICATIONS) {
          const numToDelete = snapshot.size - MAX_NOTIFICATIONS + 1;
          const docsToDelete = snapshot.docs.slice(0, numToDelete);
          docsToDelete.forEach(doc => {
              transaction.delete(doc.ref);
          });
      }
  });
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const snapshot = await firestore.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  const snapshot = await firestore.collection('notifications')
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await firestore.collection('notifications').doc(notificationId).update({
    isRead: true,
  });
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    const batch = firestore.batch();
    const snapshot = await firestore.collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();
      
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();
};
