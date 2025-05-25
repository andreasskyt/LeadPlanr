'use client';

import { useState } from 'react';
import MonthView from './components/MonthView';
import DayWeekView from './components/DayWeekView';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Top section with month view and day/week view */}
      <div className="flex gap-4 h-[50vh] min-h-[300px]">
        {/* Left side - Month View */}
        <div className="bg-white rounded-lg shadow p-2">
          <MonthView
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setViewMode('day');
            }}
            onWeekSelect={(date) => {
              setSelectedDate(date);
              setViewMode('week');
            }}
            viewMode={viewMode}
          />
        </div>

        {/* Right side - Day/Week View */}
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <DayWeekView
            selectedDate={selectedDate}
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Bottom section - Map placeholder */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 mt-2">
        <div className="h-full flex items-center justify-center text-gray-400">
          Map view coming soon
        </div>
      </div>
    </div>
  );
} 