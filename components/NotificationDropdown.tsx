import React from 'react';
import { Notification } from '../types';
import Button from './Button';

interface NotificationDropdownProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAllRead: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onMarkAllRead }) => {
    return (
        <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-scale-in z-50">
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h4>
                {notifications.some(n => !n.isRead) && (
                    <button onClick={onMarkAllRead} className="text-xs text-blue-500 hover:underline">
                        Mark all as read
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-8">No notifications yet.</p>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-gray-100 dark:border-gray-700/50 ${!n.isRead ? 'bg-blue-500/10' : ''}`}>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(n.createdAt?.toDate()).toLocaleString()}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;