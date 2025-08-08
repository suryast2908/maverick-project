

import React, { useState, useEffect, useMemo } from 'react';
import { DiscussionThread, DiscussionReply, UserProfile } from '../types';
import { getThreadWithReplies, addReply, deleteThread, deleteReply, voteOnThread, voteOnReply } from '../services/discussionService';
import { GetThreadsFilters } from '../../services/discussionService';
import Card from './Card';
import Button from './Button';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import TrashIcon from './icons/TrashIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface DiscussionThreadViewProps {
    threadId: string;
    user: { profile: UserProfile, role: 'user' | 'admin' };
    onBack: () => void;
    initialScope: GetThreadsFilters['scope'];
}

const Post: React.FC<{
    authorName: string;
    authorAvatar: string;
    timestamp: any;
    content: string;
    isAdmin: boolean;
    onDelete: () => void;
    isReply: boolean;
    // Vote props
    upvotes: number;
    downvotes: number;
    userVote: 'up' | 'down' | null;
    onVote: (voteType: 'up' | 'down') => void;
}> = ({ authorName, authorAvatar, timestamp, content, isAdmin, onDelete, isReply, upvotes, downvotes, userVote, onVote }) => {
    const netVotes = upvotes - downvotes;
    
    return (
        <div className="flex items-start gap-4 group relative">
            <div className="flex flex-col items-center">
                <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full mt-1" />
                <div className="flex flex-col items-center justify-start pt-4 flex-shrink-0">
                    <button
                        onClick={() => onVote('up')}
                        className={`p-1.5 rounded-full transition-colors ${userVote === 'up' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        aria-label="Upvote"
                    >
                        <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <span className="font-bold text-base my-1 text-gray-700 dark:text-gray-300">{netVotes}</span>
                    <button
                        onClick={() => onVote('down')}
                        className={`p-1.5 rounded-full transition-colors ${userVote === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        aria-label="Downvote"
                    >
                        <ArrowDownIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="flex-grow bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{authorName}</span>
                    <span className="text-gray-500 dark:text-gray-400">• {timestamp ? new Date(timestamp.toDate()).toLocaleString() : 'Just now'}</span>
                </div>
                <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-line">{content}</p>
            </div>
            {isAdmin && (
                <button
                    onClick={onDelete}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={isReply ? "Delete reply" : "Delete thread"}
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

const DiscussionThreadView: React.FC<DiscussionThreadViewProps> = ({ threadId, user, onBack, initialScope }) => {
    const [thread, setThread] = useState<DiscussionThread | null>(null);
    const [replies, setReplies] = useState<DiscussionReply[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newReply, setNewReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchThread = async () => {
        setIsLoading(true);
        try {
            const data = await getThreadWithReplies(threadId);
            if (data) {
                setThread(data.thread);
                setReplies(data.replies);
            }
        } catch (error) {
            console.error("Failed to fetch thread:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchThread();
    }, [threadId]);
    
    const orderedReplies = useMemo(() => {
        if (initialScope === 'My Replies' && replies.length > 0) {
            const myReplies = replies.filter(r => r.authorId === user.profile.id);
            const otherReplies = replies.filter(r => r.authorId !== user.profile.id);
            return [...myReplies, ...otherReplies];
        }
        return replies;
    }, [replies, initialScope, user.profile.id]);

    const handlePostReply = async () => {
        if (!newReply.trim()) return;
        setIsSubmitting(true);
        try {
            const replyData = {
                threadId,
                authorId: user.profile.id,
                authorName: user.profile.name,
                authorAvatar: user.profile.avatar,
                content: newReply,
            };
            await addReply(threadId, replyData);
            setNewReply('');
            await fetchThread(); // Refetch to get all updates
        } catch (error) {
            console.error("Failed to post reply:", error);
            alert("Failed to post reply. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteThread = async () => {
        if (window.confirm("Are you sure you want to permanently delete this thread and all its replies?")) {
            try {
                await deleteThread(threadId);
                onBack();
            } catch (error) {
                console.error("Failed to delete thread:", error);
                alert("Could not delete the thread. Please try again.");
            }
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this reply?")) {
            try {
                await deleteReply(threadId, replyId);
                fetchThread();
            } catch (error) {
                console.error("Failed to delete reply:", error);
                alert("Could not delete the reply. Please try again.");
            }
        }
    };

    const handleVote = (type: 'thread' | 'reply', id: string, voteType: 'up' | 'down') => {
        // Optimistic update
        if (type === 'thread') {
            setThread(prevThread => {
                if (!prevThread) return null;
                const isUpvoted = prevThread.upvotedBy.includes(user.profile.id);
                const isDownvoted = prevThread.downvotedBy.includes(user.profile.id);
                const newThread = { ...prevThread, upvotedBy: [...prevThread.upvotedBy], downvotedBy: [...prevThread.downvotedBy] };
                 if (voteType === 'up') {
                    if (isUpvoted) { newThread.upvotes--; newThread.upvotedBy = newThread.upvotedBy.filter(uid => uid !== user.profile.id); } 
                    else { newThread.upvotes++; newThread.upvotedBy.push(user.profile.id); if (isDownvoted) { newThread.downvotes--; newThread.downvotedBy = newThread.downvotedBy.filter(uid => uid !== user.profile.id); } }
                } else {
                    if (isDownvoted) { newThread.downvotes--; newThread.downvotedBy = newThread.downvotedBy.filter(uid => uid !== user.profile.id); } 
                    else { newThread.downvotes++; newThread.downvotedBy.push(user.profile.id); if (isUpvoted) { newThread.upvotes--; newThread.upvotedBy = newThread.upvotedBy.filter(uid => uid !== user.profile.id); } }
                }
                return newThread;
            });
            voteOnThread(id, user.profile.id, voteType).catch(() => fetchThread()); // Revert on error
        } else { // reply
            setReplies(prevReplies => prevReplies.map(r => {
                if (r.id === id) {
                    const isUpvoted = r.upvotedBy.includes(user.profile.id);
                    const isDownvoted = r.downvotedBy.includes(user.profile.id);
                    const newReply = { ...r, upvotedBy: [...r.upvotedBy], downvotedBy: [...r.downvotedBy] };
                    if (voteType === 'up') {
                        if (isUpvoted) { newReply.upvotes--; newReply.upvotedBy = newReply.upvotedBy.filter(uid => uid !== user.profile.id); } 
                        else { newReply.upvotes++; newReply.upvotedBy.push(user.profile.id); if (isDownvoted) { newReply.downvotes--; newReply.downvotedBy = newReply.downvotedBy.filter(uid => uid !== user.profile.id); } }
                    } else {
                        if (isDownvoted) { newReply.downvotes--; newReply.downvotedBy = newReply.downvotedBy.filter(uid => uid !== user.profile.id); } 
                        else { newReply.downvotes++; newReply.downvotedBy.push(user.profile.id); if (isUpvoted) { newReply.upvotes--; newReply.upvotedBy = newReply.upvotedBy.filter(uid => uid !== user.profile.id); } }
                    }
                    return newReply;
                }
                return r;
            }));
            voteOnReply(threadId, id, user.profile.id, voteType).catch(() => fetchThread()); // Revert on error
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full pt-16">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4">Loading discussion...</p>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className="text-center pt-16">
                <p className="text-red-500">Could not load discussion thread.</p>
                <Button onClick={onBack} className="mt-4">Back to Discussions</Button>
            </div>
        );
    }
    const userVoteOnThread = thread.upvotedBy.includes(user.profile.id) ? 'up' : thread.downvotedBy.includes(user.profile.id) ? 'down' : null;

    return (
        <Card title={thread.title} icon={<ChatBubbleIcon />}>
            <div className="space-y-6">
                <Post
                    authorName={thread.authorName}
                    authorAvatar={thread.authorAvatar}
                    timestamp={thread.timestamp}
                    content={thread.content}
                    isAdmin={user.role === 'admin'}
                    onDelete={handleDeleteThread}
                    isReply={false}
                    upvotes={thread.upvotes}
                    downvotes={thread.downvotes}
                    userVote={userVoteOnThread}
                    onVote={(voteType) => handleVote('thread', thread.id, voteType)}
                />
                
                <div className="border-t border-gray-200 dark:border-gray-700/50 pt-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{thread.replyCount} Replies</h3>
                    {orderedReplies.map(reply => {
                        const userVoteOnReply = reply.upvotedBy.includes(user.profile.id) ? 'up' : reply.downvotedBy.includes(user.profile.id) ? 'down' : null;
                        return (
                            <Post
                                key={reply.id}
                                authorName={reply.authorName}
                                authorAvatar={reply.authorAvatar}
                                timestamp={reply.timestamp}
                                content={reply.content}
                                isAdmin={user.role === 'admin'}
                                onDelete={() => handleDeleteReply(reply.id)}
                                isReply={true}
                                upvotes={reply.upvotes}
                                downvotes={reply.downvotes}
                                userVote={userVoteOnReply}
                                onVote={(voteType) => handleVote('reply', reply.id, voteType)}
                            />
                        );
                    })}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700/50 pt-6">
                     <div className="flex items-start gap-4">
                        <img src={user.profile.avatar} alt={user.profile.name} className="w-10 h-10 rounded-full mt-1" />
                        <div className="flex-grow">
                            <textarea
                                value={newReply}
                                onChange={(e) => setNewReply(e.target.value)}
                                placeholder="Add to the discussion..."
                                rows={4}
                                className="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                                <Button variant="secondary" onClick={onBack}>Back to List</Button>
                                <Button onClick={handlePostReply} disabled={isSubmitting}>
                                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DiscussionThreadView;
