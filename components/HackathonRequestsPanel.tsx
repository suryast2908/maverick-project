import React, { useState } from 'react';
import { HackathonRequest } from '../types';
import Card from './Card';
import Button from './Button';
import TrophyIcon from './icons/TrophyIcon';
import CreateHackathonModal from './CreateHackathonModal';
import { updateHackathonRequestStatus } from '../services/hackathonService';

interface HackathonRequestsPanelProps {
    requests: HackathonRequest[];
    onUpdateRequest: (requestId: string, status: 'approved' | 'rejected', hackathonId?: string) => void;
    onRefresh: () => void;
}

const RequestItem: React.FC<{
    req: HackathonRequest;
    onApprove: (request: HackathonRequest) => void;
    onReject: (requestId: string) => void;
}> = ({ req, onApprove, onReject }) => {
    const StatusBadge: React.FC<{status: 'approved' | 'rejected'}> = ({status}) => {
        const isApproved = status === 'approved';
        return (
            <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                isApproved ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'
            }`}>
                {isApproved ? 'Approved' : 'Rejected'}
            </span>
        );
    };

    return (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {req.userName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {req.timestamp ? new Date(req.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
                {req.status === 'pending' ? (
                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(req)}>
                            Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onReject(req.id)}>
                            Reject
                        </Button>
                    </div>
                ) : (
                    <StatusBadge status={req.status} />
                )}
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-md">
                {req.requestText}
            </p>
        </div>
    );
};

const HackathonRequestsPanel: React.FC<HackathonRequestsPanelProps> = ({ requests, onUpdateRequest, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestToApprove, setRequestToApprove] = useState<HackathonRequest | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');

    const handleOpenApprovalModal = (request: HackathonRequest) => {
        setRequestToApprove(request);
        setIsModalOpen(true);
    };

    const handleReject = async (requestId: string) => {
        if (window.confirm("Are you sure you want to reject this request?")) {
            onUpdateRequest(requestId, 'rejected');
        }
    };

    const handleHackathonCreated = async (hackathonId: string) => {
        if (!requestToApprove) return;
        onUpdateRequest(requestToApprove.id, 'approved', hackathonId);
        setIsModalOpen(false);
        setRequestToApprove(null);
    };
    
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const reviewedRequests = requests.filter(r => r.status !== 'pending');
    const displayedRequests = activeTab === 'pending' ? pendingRequests : reviewedRequests;

    const tabButtons = (
        <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-900/50 p-1">
            <button
                onClick={() => setActiveTab('pending')}
                className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-white/10'}`}
            >
                Pending ({pendingRequests.length})
            </button>
            <button
                onClick={() => setActiveTab('reviewed')}
                className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'reviewed' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-white/10'}`}
            >
                Reviewed ({reviewedRequests.length})
            </button>
        </div>
    );

    return (
        <>
            <CreateHackathonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                requestToApprove={requestToApprove}
                onHackathonCreated={handleHackathonCreated}
            />

            <Card title="Hackathon Requests" icon={<TrophyIcon className="h-5 w-5" />} headerActions={tabButtons}>
                <div className="space-y-3 h-[28rem] overflow-y-auto custom-scrollbar p-1">
                    {displayedRequests.length > 0 ? (
                        displayedRequests.map(req => (
                            <RequestItem
                                key={req.id}
                                req={req}
                                onApprove={handleOpenApprovalModal}
                                onReject={handleReject}
                            />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-center text-gray-500 py-6">No {activeTab} requests.</p>
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
};

export default HackathonRequestsPanel;
