import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useCalendar } from '@/contexts/CalendarContext';

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
  onEventCreated?: (event: any) => void;
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
  onEventCreated,
}) => {
  const { selectedCalendarId } = useCalendar();
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (!title || !location || !startTime || !endTime || !selectedCalendarId) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const start = new Date(`${selectedDate}T${startTime}`).toISOString();
      const end = new Date(`${selectedDate}T${endTime}`).toISOString();

      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          start,
          end,
          location,
          calendarId: selectedCalendarId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Notify parent that event was created and wait for refresh
      if (onEventCreated) {
        const createdEvent = await response.json();
        onEventCreated(createdEvent);
      }
      // Now clear the form
      setTitle('');
      setLocation('');
      setStartTime('');
      setEndTime('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = !!(title && location && startTime && endTime && selectedCalendarId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="p-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">New Appointment</h3>
          <button
            onClick={handleCreate}
            disabled={!isFormValid || isCreating}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isFormValid && !isCreating
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
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