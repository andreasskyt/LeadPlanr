"use client";
import { useEffect, useState, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { CalendarEvent } from '@/lib/calendar-service';
import { DAY_COLORS } from './DayWeekView';

const DEFAULT_CENTER = { lat: 55.6761, lng: 12.5683 }; // Copenhagen as fallback
const RADIUS_METERS = 300000; // 300km

interface MapViewProps {
  events: (CalendarEvent & { lat?: number; long?: number; dayIndex?: number; dayOfWeekIdx?: number })[];
  eventsByDay: Record<string, (CalendarEvent & { lat: number; long: number; dayIndex: number; dayOfWeekIdx: number })[]>;
  loading?: boolean;
  hoveredEventId?: string | null;
  setHoveredEventId?: (id: string | null) => void;
  newAppointmentMarker?: {
    lat: number;
    long: number;
    location: string;
    title: string;
    startTime: string;
    endTime: string;
    date: Date;
  } | null;
}

// Helper for drawing polylines using the imperative API
function Polylines({ eventsByDay }: { eventsByDay: MapViewProps['eventsByDay'] }) {
  const map = useMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;
    // Remove old polylines
    polylinesRef.current.forEach(line => line.setMap(null));
    polylinesRef.current = [];
    // Draw new polylines
    Object.values(eventsByDay).forEach(dayEvents => {
      if (dayEvents.length > 1) {
        const path = dayEvents.map(e => ({ lat: e.lat, lng: e.long }));
        const color = DAY_COLORS[dayEvents[0].dayOfWeekIdx ?? 0];
        const polyline = new google.maps.Polyline({
          path,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: 3,
          map,
        });
        polylinesRef.current.push(polyline);
      }
    });
    return () => {
      polylinesRef.current.forEach(line => line.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, eventsByDay]);
  return null;
}

// Helper component to handle map bounds
function MapBounds({ events, newAppointmentMarker }: { events: MapViewProps['events'], newAppointmentMarker?: { lat: number; long: number; location: string } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || (events.length === 0 && !newAppointmentMarker)) return;

    const bounds = new google.maps.LatLngBounds();
    events.forEach(event => {
      if (event.lat && event.long) {
        bounds.extend({ lat: event.lat, lng: event.long });
      }
    });
    if (newAppointmentMarker) {
      bounds.extend({ lat: newAppointmentMarker.lat, lng: newAppointmentMarker.long });
    }
    // Add some padding to the bounds
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    map.fitBounds(bounds, padding);
  }, [map, events, newAppointmentMarker]);

  return null;
}

export default function MapView({ events, eventsByDay, loading, hoveredEventId, setHoveredEventId, newAppointmentMarker }: MapViewProps) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [hoveredNewMarker, setHoveredNewMarker] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLoaded(true);
        },
        () => setLocationLoaded(true)
      );
    } else {
      setLocationLoaded(true);
    }
  }, []);

  const zoom = 9;

  if (loading || !locationLoaded) {
    return <div className="h-full flex items-center justify-center text-gray-400">Loading map...</div>;
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        style={{ width: "100%", height: "100%", borderRadius: 12 }}
        disableDefaultUI={true}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
      >
        {/* Draw lines for each day using imperative API */}
        <Polylines eventsByDay={eventsByDay} />
        {/* Handle map bounds */}
        <MapBounds events={events} newAppointmentMarker={newAppointmentMarker} />
        {/* Markers with indexes */}
        {events.filter(e => e.lat && e.long).map(event => (
          <AdvancedMarker
            key={event.id}
            position={{ lat: event.lat!, lng: event.long! }}
            onMouseEnter={() => setHoveredEventId && setHoveredEventId(event.id)}
            onMouseLeave={() => setHoveredEventId && setHoveredEventId(null)}
          >
            <Pin
              background={DAY_COLORS[event.dayOfWeekIdx ?? 0]}
              borderColor={hoveredEventId === event.id ? '#1e40af' : '#222'}
              glyphColor="white"
              scale={hoveredEventId === event.id ? 1.5 : 1}
            >
              <span style={{ fontWeight: 'bold', fontSize: hoveredEventId === event.id ? 20 : 16 }}>{event.dayIndex}</span>
            </Pin>
            {hoveredEventId === event.id && event.lat && event.long && (
              <InfoWindow 
                position={{ lat: event.lat, lng: event.long }}
                pixelOffset={[0, -40]}
                onClose={() => setHoveredEventId && setHoveredEventId(null)}
                shouldFocus={false}
                disableAutoPan={true}
              >
                <div className="min-w-[180px] max-w-[200px] max-h-[150px] overflow-hidden">
                  <div className="font-semibold text-base mb-1 truncate">{event.title}</div>
                  {event.location && <div className="text-xs text-gray-600 mb-1 truncate">{event.location}</div>}
                  <div className="text-xs">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </InfoWindow>
            )}
          </AdvancedMarker>
        ))}
        {/* Special marker for new appointment location */}
        {newAppointmentMarker && (
          <AdvancedMarker
            key="new-appointment-marker"
            position={{ lat: newAppointmentMarker.lat, lng: newAppointmentMarker.long }}
            onMouseEnter={() => setHoveredNewMarker(true)}
            onMouseLeave={() => setHoveredNewMarker(false)}
          >
            <Pin
              background="#e11d48" // rose-600
              borderColor="#be123c" // rose-800
              glyphColor="white"
              scale={hoveredNewMarker ? 1.5 : 1}
            >
              <span style={{ fontWeight: 'bold', fontSize: hoveredNewMarker ? 20 : 16 }}>+</span>
            </Pin>
            {hoveredNewMarker && (
              <InfoWindow
                position={{ lat: newAppointmentMarker.lat, lng: newAppointmentMarker.long }}
                pixelOffset={[0, -40]}
                onClose={() => setHoveredNewMarker(false)}
                shouldFocus={false}
                disableAutoPan={true}
              >
                <div className="min-w-[180px] max-w-[200px] max-h-[150px] overflow-hidden">
                  <div className="font-semibold text-base mb-1 truncate">{newAppointmentMarker.title || 'New Appointment'}</div>
                  {newAppointmentMarker.location && <div className="text-xs text-gray-600 mb-1 truncate">{newAppointmentMarker.location}</div>}
                  <div className="text-xs">
                    {newAppointmentMarker.startTime && newAppointmentMarker.endTime
                      ? `${newAppointmentMarker.startTime} - ${newAppointmentMarker.endTime}`
                      : ''}
                  </div>
                </div>
              </InfoWindow>
            )}
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
} 