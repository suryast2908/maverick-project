import React, { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: Date;
}

const Countdown: React.FC<CountdownProps> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        let timeLeft = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });
    
    const TimerSegment: React.FC<{ value: number, label: string }> = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700/50 px-3 py-2 rounded-lg">{String(value).padStart(2, '0')}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
        </div>
    );

    const isFinished = !Object.values(timeLeft).some(val => val > 0);

    if (isFinished) {
        return <div className="text-center font-bold text-xl text-green-500">Event is Live!</div>;
    }

    return (
        <div className="flex items-center justify-center gap-2 md:gap-4">
            <TimerSegment value={timeLeft.days} label="Days" />
            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
            <TimerSegment value={timeLeft.hours} label="Hours" />
            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
            <TimerSegment value={timeLeft.minutes} label="Mins" />
            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
            <TimerSegment value={timeLeft.seconds} label="Secs" />
        </div>
    );
};

export default Countdown;