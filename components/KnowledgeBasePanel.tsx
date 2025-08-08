import React, { useState } from 'react';
import { KnowledgeDocument } from '../types';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import BookOpenIcon from './icons/BookOpenIcon';

interface KnowledgeBasePanelProps {
    documents: KnowledgeDocument[];
    onAddDocument: (title: string, content: string) => Promise<void>;
    onRemoveDocument: (id: string) => Promise<void>;
}

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({ documents, onAddDocument, onRemoveDocument }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocContent, setNewDocContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddClick = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setNewDocTitle('');
        setNewDocContent('');
    };

    const handleSaveDocument = async () => {
        if (!newDocTitle.trim() || !newDocContent.trim()) {
            alert('Title and content are required.');
            return;
        }
        setIsSubmitting(true);
        await onAddDocument(newDocTitle, newDocContent);
        setIsSubmitting(false);
        handleModalClose();
    };
    
    return (
        <>
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title="Add New Document to Knowledge Base"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Simulate uploading a PDF by providing a title and pasting its text content. This document will be used by the AI to generate personalized learning paths.</p>
                    <div>
                        <label htmlFor="doc-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Title (e.g., "Advanced React Hooks")</label>
                        <input
                            id="doc-title"
                            type="text"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter the document title"
                        />
                    </div>
                     <div>
                        <label htmlFor="doc-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pasted Document Content</label>
                        <textarea
                            id="doc-content"
                            value={newDocContent}
                            onChange={(e) => setNewDocContent(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-800 dark:text-gray-200 font-mono"
                            placeholder="Paste the full text from your PDF or notes here..."
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <Button variant="secondary" onClick={handleModalClose}>Cancel</Button>
                        <Button onClick={handleSaveDocument} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Document'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Card title="AI Knowledge Base" icon={<BookOpenIcon />}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400">Manage the documents used for RAG-based learning path generation.</p>
                        <Button onClick={handleAddClick}>Add New Document</Button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                        {documents.length > 0 ? (
                            documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors">
                                    <div className="flex items-center">
                                        <FileIcon />
                                        <div className="ml-3">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{doc.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Added on: {new Date(doc.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button variant="danger" className="p-2" onClick={() => onRemoveDocument(doc.id)} aria-label="Remove document">
                                        <TrashIcon />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No documents in the knowledge base. Add one to get started.</p>
                        )}
                    </div>
                </div>
            </Card>
        </>
    );
};

export default KnowledgeBasePanel;