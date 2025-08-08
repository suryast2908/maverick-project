
import React, { useState, useEffect } from 'react';
import { UserProfile, CustomAssessment, QuizConfig } from '../types';
import { getAssignedAssessmentsForUser } from '../services/assessmentService';
import AssessmentCard from './AssessmentCard';

interface PersonalizedAssessmentsPanelProps {
    user: UserProfile;
    onStartQuiz: (config: QuizConfig) => void;
}

const PersonalizedAssessmentsPanel: React.FC<PersonalizedAssessmentsPanelProps> = ({ user, onStartQuiz }) => {
    const [assessments, setAssessments] = useState<CustomAssessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssessments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedAssessments = await getAssignedAssessmentsForUser(user.id);
                setAssessments(fetchedAssessments);
            } catch (err) {
                console.error(err);
                setError("Failed to load your personalized assessments.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssessments();
    }, [user.id]);

    if (isLoading) {
        return <div className="text-center p-12 text-gray-500">Loading assessments...</div>;
    }

    if (error) {
        return <div className="text-center p-12 text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            {assessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assessments.map((assessment, index) => (
                        <div key={assessment.id} className="animate-fade-in-stagger" style={{ animationDelay: `${index * 100}ms` }}>
                          <AssessmentCard 
                              assessment={assessment}
                              onStart={onStartQuiz}
                          />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-16 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">No Assessments Assigned</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        You do not have any personalized assessments assigned to you at the moment. Check back later!
                    </p>
                </div>
            )}
        </div>
    );
};

export default PersonalizedAssessmentsPanel;
