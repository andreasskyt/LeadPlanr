import React from 'react';

interface NewAppointmentViewProps {
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  initialTitle?: string;
  initialLocation?: string;
  location: string;
  setLocation: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
}

const NewAppointmentView: React.FC<NewAppointmentViewProps> = ({
  selectedDate,
  setSelectedDate,
  initialTitle = '',
  initialLocation = '',
  location,
  setLocation,
  title,
  setTitle,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}) => {
  return (
    <div className="p-2">
      <h3 className="text-lg font-semibold mb-4">Create New Appointment</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter appointment title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address"
            value={location ?? initialLocation}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentView; 