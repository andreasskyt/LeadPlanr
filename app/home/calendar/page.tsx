'use client';

import { useState } from 'react';
import MonthView from './components/MonthView';
import DayWeekView from './components/DayWeekView';
import MapView from './components/MapView';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Top section with month view and day/week view */}
      <div className="flex gap-4 h-[33vh] min-h-[200px]">
        {/* Left side - Month View */}
        <div className="w-[320px] bg-white rounded-lg shadow p-2">
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

      {/* Bottom section with appointment card and map */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left side - New Appointment Card */}
        <div className="w-[320px] bg-white rounded-lg shadow p-2">
          <div className="p-2">
            <h3 className="text-lg font-semibold mb-4">Create New Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter appointment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDate.toISOString().split('T')[0]}
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Map View */}
        <div className="flex-1 bg-white rounded-lg shadow p-4">
          <MapView />
        </div>
      </div>
    </div>
  );
} 