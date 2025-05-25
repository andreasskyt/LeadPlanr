'use client';

interface DayWeekViewProps {
  selectedDate: Date;
  viewMode: 'day' | 'week';
}

export default function DayWeekView({ selectedDate, viewMode }: DayWeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getWeekDates = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(date.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date(monday);
      newDate.setDate(monday.getDate() + i);
      return newDate;
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHeader = (date: Date): string => {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const day = date.getDate();
    return `${weekday} ${day}`;
  };

  const renderDayView = () => {
    return (
      <div className="h-full">
        <div className="text-xl font-semibold mb-4">
          {formatDate(selectedDate)}
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="flex border-b border-gray-200">
              <div className="w-16 p-2 text-sm text-gray-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-2 min-h-[60px]">
                {/* Appointment slots will go here */}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(selectedDate);
    
    return (
      <div className="h-full">
        <div className="grid grid-cols-8 gap-0 mb-2">
          <div></div>
          {weekDates.map((date) => (
            <div key={date.toISOString()} className="text-center font-semibold">
              {formatHeader(date)}
            </div>
          ))}
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
              <div className="text-sm text-gray-500 p-2 text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDates.map((date) => (
                <div key={date.toISOString()} className="p-2 min-h-[60px] border-l border-gray-200">
                  {/* Appointment slots will go here */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {viewMode === 'day' ? renderDayView() : renderWeekView()}
    </div>
  );
} 