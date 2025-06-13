import React from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarEvent } from '@/lib/calendar-service';

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

interface TimeSuggestion {
  start: string; // ISO string
  end: string; // ISO string
  addedKilometers: number;
}

interface EventWithLocation extends CalendarEvent {
  lat?: number;
  long?: number;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c); // Distance in km, rounded to integer
}

function suggestTimesForEvent(
  newEvent: { lat: number; long: number },
  existingEvents: EventWithLocation[],
  dateRange: { start: Date; end: Date }
): TimeSuggestion[] {
  const EVENT_DURATION = 60; // 1 hour in minutes
  const WORK_START = 8; // 8:00
  const WORK_END = 18; // 18:00
  const TRAVEL_SPEED = 50; // km/h

  const suggestions: TimeSuggestion[] = [];
  const currentDate = new Date(dateRange.start);

  while (currentDate <= dateRange.end) {
    // Define working hours for the day
    const dayStart = new Date(currentDate);
    dayStart.setHours(WORK_START, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(WORK_END, 0, 0, 0);

    // 1. Clip all events to working hours and filter out events that don't overlap working hours
    const dayEvents = existingEvents
      .map(e => {
        const eventStart = new Date(e.start);
        const eventEnd = new Date(e.end);
        if (eventEnd <= dayStart || eventStart >= dayEnd) return null;
        const clippedStart = eventStart < dayStart ? new Date(dayStart) : eventStart;
        const clippedEnd = eventEnd > dayEnd ? new Date(dayEnd) : eventEnd;
        return { ...e, start: clippedStart, end: clippedEnd };
      })
      .filter((e): e is EventWithLocation & { start: Date; end: Date } => e !== null)
      .sort((a, b) => (a.start as Date).getTime() - (b.start as Date).getTime());

    // 2. Merge overlapping events, keeping location of first event for start and last event for end
    const mergedEvents: { start: Date; end: Date; lat?: number; long?: number; startLat?: number; startLong?: number; endLat?: number; endLong?: number }[] = [];
    for (const e of dayEvents) {
      const start = e.start as Date;
      const end = e.end as Date;
      if (mergedEvents.length === 0) {
        mergedEvents.push({ start, end, lat: e.lat, long: e.long, startLat: e.lat, startLong: e.long, endLat: e.lat, endLong: e.long });
      } else {
        const last = mergedEvents[mergedEvents.length - 1];
        if (start <= last.end) {
          // Overlap, merge
          last.end = new Date(Math.max(last.end.getTime(), end.getTime()));
          // Keep startLat/startLong from the first event, update endLat/endLong from the current event if it extends the interval
          if (end.getTime() >= last.end.getTime()) {
            last.endLat = e.lat;
            last.endLong = e.long;
          }
        } else {
          mergedEvents.push({ start, end, lat: e.lat, long: e.long, startLat: e.lat, startLong: e.long, endLat: e.lat, endLong: e.long });
        }
      }
    }

    // 3. Find all gaps between merged events within working hours
    const intervals: { start: Date; end: Date; prevEvent?: typeof mergedEvents[0]; nextEvent?: typeof mergedEvents[0] }[] = [];
    let prevEnd = new Date(dayStart);
    for (let i = 0; i < mergedEvents.length; i++) {
      const event = mergedEvents[i];
      if (event.start > prevEnd) {
        intervals.push({
          start: new Date(prevEnd),
          end: new Date(event.start),
          prevEvent: i > 0 ? mergedEvents[i - 1] : undefined,
          nextEvent: event
        });
      }
      prevEnd = new Date(Math.max(prevEnd.getTime(), event.end.getTime()));
    }
    if (prevEnd < dayEnd) {
      intervals.push({
        start: new Date(prevEnd),
        end: new Date(dayEnd),
        prevEvent: mergedEvents.length > 0 ? mergedEvents[mergedEvents.length - 1] : undefined
      });
    }

    console.log('[DEBUG][suggestTimesForEvent] Date:', currentDate.toDateString(), 'Intervals:', intervals);

    // 4. For each gap, check if the new event (plus travel time) fits
    for (const interval of intervals) {
      const intervalDuration = (interval.end.getTime() - interval.start.getTime()) / (1000 * 60);
      if (intervalDuration < EVENT_DURATION) {
        console.log('[DEBUG][suggestTimesForEvent] Skipping interval (too short):', interval, 'Duration:', intervalDuration);
        continue;
      }

      // Calculate travel times
      let travelTimeTo = 0;
      let travelTimeFrom = 0;
      let addedKilometers = 0;

      // Debug prevEvent/nextEvent
      console.log('[DEBUG][suggestTimesForEvent] Interval:', interval);
      if (interval.prevEvent) {
        console.log('[DEBUG][suggestTimesForEvent] prevEvent:', interval.prevEvent, 'startLat:', interval.prevEvent.startLat, 'startLong:', interval.prevEvent.startLong, 'endLat:', interval.prevEvent.endLat, 'endLong:', interval.prevEvent.endLong);
      }
      if (interval.nextEvent) {
        console.log('[DEBUG][suggestTimesForEvent] nextEvent:', interval.nextEvent, 'startLat:', interval.nextEvent.startLat, 'startLong:', interval.nextEvent.startLong, 'endLat:', interval.nextEvent.endLat, 'endLong:', interval.nextEvent.endLong);
      }

      // Use endLat/endLong for prevEvent (end of previous busy period)
      if (interval.prevEvent?.endLat != null && interval.prevEvent?.endLong != null) {
        const distanceTo = calculateDistance(
          interval.prevEvent.endLat,
          interval.prevEvent.endLong,
          newEvent.lat,
          newEvent.long
        );
        travelTimeTo = Math.ceil((distanceTo / TRAVEL_SPEED) * 60 / 30) * 30;
        addedKilometers += distanceTo;
        console.log('[DEBUG][suggestTimesForEvent] Travel from prevEvent end:', interval.prevEvent.endLat, interval.prevEvent.endLong, 'to', newEvent.lat, newEvent.long, 'Distance:', distanceTo, 'TravelTimeTo:', travelTimeTo);
      }

      // Use startLat/startLong for nextEvent (start of next busy period)
      if (interval.nextEvent?.startLat != null && interval.nextEvent?.startLong != null) {
        const distanceFrom = calculateDistance(
          newEvent.lat,
          newEvent.long,
          interval.nextEvent.startLat,
          interval.nextEvent.startLong
        );
        travelTimeFrom = Math.ceil((distanceFrom / TRAVEL_SPEED) * 60 / 30) * 30;
        addedKilometers += distanceFrom;
        console.log('[DEBUG][suggestTimesForEvent] Travel to nextEvent start:', newEvent.lat, newEvent.long, 'to', interval.nextEvent.startLat, interval.nextEvent.startLong, 'Distance:', distanceFrom, 'TravelTimeFrom:', travelTimeFrom);
      }

      // Calculate available subinterval
      const availableStart = new Date(interval.start.getTime() + travelTimeTo * 60 * 1000);
      const availableEnd = new Date(interval.end.getTime() - travelTimeFrom * 60 * 1000);
      const availableDuration = (availableEnd.getTime() - availableStart.getTime()) / (1000 * 60);
      if (availableDuration >= EVENT_DURATION) {
        suggestions.push({
          start: availableStart.toISOString(),
          end: availableEnd.toISOString(),
          addedKilometers
        });
        console.log('[DEBUG][suggestTimesForEvent] Added suggestion:', {
          start: availableStart,
          end: availableEnd,
          addedKilometers
        });
      } else {
        console.log('[DEBUG][suggestTimesForEvent] Skipping available interval (not enough time after travel):', {
          availableStart,
          availableEnd,
          availableDuration,
          interval
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const filtered = suggestions
    .sort((a, b) => {
      const aKm = a.addedKilometers === 0 ? Infinity : a.addedKilometers;
      const bKm = b.addedKilometers === 0 ? Infinity : b.addedKilometers;
      if (aKm !== bKm) return aKm - bKm;
      // If both are 0 or equal, sort by start date ascending
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

  console.log('[DEBUG][suggestTimesForEvent] Final filtered suggestions:', filtered);
  return filtered;
}

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
  setViewMode: (mode: 'day' | 'week') => void;
  currentViewMode: 'day' | 'week';
  onCalendarDateSelect: (date: Date) => void;
  onSuggestionSelect: (suggestion: TimeSuggestion) => void;
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
  setViewMode,
  currentViewMode,
  onCalendarDateSelect,
  onSuggestionSelect,
}) => {
  const { selectedCalendarId } = useCalendar();
  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'suggestions' | 'manual'>('suggestions');
  const [suggestions, setSuggestions] = React.useState<TimeSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState<TimeSuggestion | null>(null);

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

  // Update suggestions when location is resolved
  React.useEffect(() => {
    if (isLocationResolved && location && selectedCalendarId) {
      // First resolve the location to get coordinates for the new event and all existing events
      fetch('/api/resolve-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations: [location],
        })
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(locationData => {
          const coordinates = locationData[location];
          if (!coordinates) {
            console.log('[DEBUG] Could not resolve location coordinates for', location, locationData);
            throw new Error('Could not resolve location coordinates');
          }

          // Get events for the next two weeks
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 14);

          return fetch(`/api/calendar-events?${new URLSearchParams({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            calendarId: selectedCalendarId
          })}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.json();
            })
            .then((events: any[]) => {
              // Gather all unique locations from events
              const eventLocations = Array.from(new Set(events.map((e: any) => e.location).filter(Boolean)));
              // Resolve all event locations
              return fetch('/api/resolve-locations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locations: eventLocations })
              })
                .then(res => {
                  if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                  }
                  return res.json();
                })
                .then((eventLocationData: Record<string, { lat: number; long: number }>) => {
                  // Merge lat/long into events
                  const eventsWithLocation = events.map((e: any) => ({
                    ...e,
                    lat: eventLocationData[e.location]?.lat,
                    long: eventLocationData[e.location]?.long,
                  }));
                  console.log('[DEBUG] Events with location:', eventsWithLocation);
                  const newSuggestions = suggestTimesForEvent(
                    { lat: coordinates.lat, long: coordinates.long },
                    eventsWithLocation,
                    { start: startDate, end: endDate }
                  );
                  console.log('[DEBUG] suggestTimesForEvent output:', newSuggestions);
                  setSuggestions(newSuggestions);
                  console.log('[DEBUG] setSuggestions called with:', newSuggestions);
                });
            });
        })
        .catch(err => {
          console.error('[DEBUG] Failed to fetch events for suggestions:', err);
          setSuggestions([]);
        });
    } else if (!selectedCalendarId) {
      setSuggestions([]);
    }
  }, [isLocationResolved, location, selectedCalendarId]);

  const formatSuggestionTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleDeleteSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionClick = (suggestion: TimeSuggestion) => {
    setSelectedSuggestion(suggestion);
    // Only update the calendar view to show the suggested day/week
    const start = new Date(suggestion.start);
    
    // If in week view, ensure we select the Monday of the week containing the suggested date
    if (currentViewMode === 'week') {
      const day = start.getDay();
      const monday = new Date(start);
      monday.setDate(start.getDate() - ((day + 6) % 7)); // Convert to Monday (Monday=0, Sunday=6)
      monday.setHours(0, 0, 0, 0); // Reset time to start of day
      onCalendarDateSelect(monday);
    } else {
      onCalendarDateSelect(start);
    }
    
    // Preserve the current view mode
    setViewMode(currentViewMode);
    
    // Notify parent about the selected suggestion
    onSuggestionSelect(suggestion);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="h-full flex flex-col overflow-hidden p-2">
        <div className="shrink-0">
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

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'suggestions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'manual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Manual
                </button>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-4">
          {activeTab === 'suggestions' ? (
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      className={`flex-1 text-left p-2 border rounded-lg transition-colors ${
                        selectedSuggestion === suggestion 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(suggestion.start).toLocaleDateString([], { 
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span>
                            {formatSuggestionTime(suggestion.start)} - {formatSuggestionTime(suggestion.end)}
                          </span>
                        </div>
                        <span className="text-blue-600">+{suggestion.addedKilometers} km</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteSuggestion(index)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <DeleteIcon className="text-gray-400 hover:text-red-500" style={{ fontSize: '1.2rem' }} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isLocationResolved ? 'No suggestions available' : 'Enter a location to see suggestions'}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default NewAppointmentView; 