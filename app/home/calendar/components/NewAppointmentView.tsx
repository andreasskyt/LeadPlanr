import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

// Generate time options in 5-minute intervals
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push(timeString);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

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
  isLocationResolved?: boolean;
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
  isLocationResolved,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              {location && (
                isLocationResolved ? (
                  <CheckCircleIcon className="text-green-500" style={{ fontSize: '1rem' }} />
                ) : (
                  <ErrorIcon className="text-red-500" style={{ fontSize: '1rem' }} />
                )
              )}
            </div>
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
              <TimePicker
                value={startTime ? new Date(`2000-01-01T${startTime}`) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const hours = newValue.getHours().toString().padStart(2, '0');
                    const minutes = newValue.getMinutes().toString().padStart(2, '0');
                    setStartTime(`${hours}:${minutes}`);
                  }
                }}
                views={['hours', 'minutes']}
                minutesStep={5}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <TimePicker
                value={endTime ? new Date(`2000-01-01T${endTime}`) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const hours = newValue.getHours().toString().padStart(2, '0');
                    const minutes = newValue.getMinutes().toString().padStart(2, '0');
                    setEndTime(`${hours}:${minutes}`);
                  }
                }}
                views={['hours', 'minutes']}
                minutesStep={5}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default NewAppointmentView; 