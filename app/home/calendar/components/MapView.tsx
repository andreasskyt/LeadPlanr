"use client";
import { useEffect, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, Polyline, InfoWindow } from "@react-google-maps/api";
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
}

export default function MapView({ events, eventsByDay, loading, hoveredEventId, setHoveredEventId }: MapViewProps) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [locationLoaded, setLocationLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

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

  useEffect(() => {
    // Remove old polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];
    if (mapRef.current) {
      Object.values(eventsByDay).forEach(dayEvents => {
        if (dayEvents.length > 1) {
          const path = dayEvents.map(e => ({ lat: e.lat, lng: e.long }));
          const polyline = new window.google.maps.Polyline({
            path,
            map: mapRef.current!,
            strokeColor: DAY_COLORS[dayEvents[0].dayOfWeekIdx ?? 0],
            strokeOpacity: 0.7,
            strokeWeight: 3,
          });
          polylinesRef.current.push(polyline);
        }
      });
    }
    // Clean up on unmount
    return () => {
      polylinesRef.current.forEach(polyline => polyline.setMap(null));
      polylinesRef.current = [];
    };
  }, [eventsByDay]);

  // Approximate zoom for 300km radius
  const zoom = 9;

  // Generate a key for the map based on the set of polylines (event IDs)
  const mapKey = Object.values(eventsByDay)
    .map(dayEvents => dayEvents.map(e => e.id).join('-'))
    .join('|');

  if (loading) {
    return <div className="h-full flex items-center justify-center text-gray-400">Loading map...</div>;
  }

  if (!isLoaded || !locationLoaded) {
    return <div className="h-full flex items-center justify-center text-gray-400">Loading map...</div>;
  }

  return (
    <GoogleMap
      center={center}
      zoom={zoom}
      mapContainerStyle={{ width: "100%", height: "100%", borderRadius: 12 }}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
      onLoad={map => { mapRef.current = map; }}
      onUnmount={() => { mapRef.current = null; }}
    >
      {/* Markers with indexes */}
      {events.filter(e => e.lat && e.long).map(event => (
        <MarkerF
          key={event.id}
          position={{ lat: event.lat!, lng: event.long! }}
          label={event.dayIndex ? { text: String(event.dayIndex), color: 'white', fontWeight: 'bold', fontSize: hoveredEventId === event.id ? '20px' : '16px' } : undefined}
          title={event.title + (event.location ? ` (${event.location})` : '')}
          icon={{
            path: window.google?.maps.SymbolPath.CIRCLE,
            scale: hoveredEventId === event.id ? 18 : 12,
            fillColor: DAY_COLORS[event.dayOfWeekIdx ?? 0],
            fillOpacity: 1,
            strokeColor: hoveredEventId === event.id ? '#1e40af' : '#222',
            strokeWeight: hoveredEventId === event.id ? 4 : 2,
          }}
          onMouseOver={() => setHoveredEventId && setHoveredEventId(event.id)}
          onMouseOut={() => setHoveredEventId && setHoveredEventId(null)}
        >
          {hoveredEventId === event.id && event.lat && event.long && (
            <InfoWindow position={{ lat: event.lat, lng: event.long }} onCloseClick={() => setHoveredEventId && setHoveredEventId(null)}>
              <div className="min-w-[180px]">
                <div className="font-semibold text-base mb-1">{event.title}</div>
                {event.location && <div className="text-xs text-gray-600 mb-1">{event.location}</div>}
                <div className="text-xs">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </InfoWindow>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
} 