
import React, { useState } from 'react';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate }) => {
  const [displayDate, setDisplayDate] = useState(selectedDate);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
  const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
  
  const prevMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  };
  
  const daysInMonth = [];
  const startDay = startOfMonth.getDay();
  for (let i = 0; i < startDay; i++) {
    daysInMonth.push(<div key={`empty-start-${i}`} className="p-1"></div>);
  }
  
  for (let day = 1; day <= endOfMonth.getDate(); day++) {
    const currentDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    const isSelected = selectedDate.toDateString() === currentDate.toDateString();
    const isToday = new Date().toDateString() === currentDate.toDateString();
    
    daysInMonth.push(
      <button
        key={day}
        onClick={() => onSelectDate(currentDate)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors text-sm ${
          isSelected
            ? 'bg-blue-600 text-white font-bold'
            : isToday
            ? 'bg-blue-200 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        {day}
      </button>
    );
  }
  
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&lt;</button>
        <div className="font-bold text-lg text-gray-800 dark:text-gray-100">
          {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth}
      </div>
    </div>
  );
};

export default Calendar;
