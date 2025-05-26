"use client";
import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF, Polyline } from "@react-google-maps/api";
import { CalendarEvent } from '@/lib/calendar-service';

const DEFAULT_CENTER = { lat: 55.6761, lng: 12.5683 }; // Copenhagen as fallback
const RADIUS_METERS = 300000; // 300km

interface MapViewProps {
  events: (CalendarEvent & { lat?: number; long?: number; dayIndex?: number })[];
  eventsByDay: Record<string, (CalendarEvent & { lat: number; long: number; dayIndex: number })[]>;
}

export default function MapView({ events, eventsByDay }: MapViewProps) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [locationLoaded, setLocationLoaded] = useState(false);

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

  // Approximate zoom for 300km radius
  const zoom = 8;

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
    >
      {/* Draw lines for each day */}
      {Object.values(eventsByDay).map((dayEvents, i) => (
        dayEvents.length > 1 ? (
          <Polyline
            key={"poly-" + i}
            path={dayEvents.map(e => ({ lat: e.lat, lng: e.long }))}
            options={{ strokeColor: '#2563eb', strokeOpacity: 0.7, strokeWeight: 3 }}
          />
        ) : null
      ))}
      {/* Markers with indexes */}
      {events.filter(e => e.lat && e.long).map(event => (
        <MarkerF
          key={event.id}
          position={{ lat: event.lat!, lng: event.long! }}
          label={event.dayIndex ? { text: String(event.dayIndex), color: 'white', fontWeight: 'bold', fontSize: '16px' } : undefined}
          title={event.title + (event.location ? ` (${event.location})` : '')}
        />
      ))}
    </GoogleMap>
  );
} 