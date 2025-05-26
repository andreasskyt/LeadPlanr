"use client";
import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { CalendarEvent } from '@/lib/calendar-service';

const DEFAULT_CENTER = { lat: 55.6761, lng: 12.5683 }; // Copenhagen as fallback
const RADIUS_METERS = 300000; // 300km

interface MapViewProps {
  events: (CalendarEvent & { lat?: number; long?: number })[];
}

export default function MapView({ events }: MapViewProps) {
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
      {events.filter(e => e.lat && e.long).map(event => (
        <div key={event.id}>
          {/* Marker will be rendered here by MarkerF below */}
          <MarkerF
            position={{ lat: event.lat!, lng: event.long! }}
            title={event.title + (event.location ? ` (${event.location})` : '')}
          />
        </div>
      ))}
    </GoogleMap>
  );
} 