"use client";

import {
  GoogleMap,
  LoadScript,
  Circle,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import { useState, useEffect } from "react";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 4.711,
  lng: -74.0721,
};

export default function MapViewOnly() {
  const [savedZone, setSavedZone] = useState<{
    center: { lat: number; lng: number };
    radius: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isInsideZone, setIsInsideZone] = useState<boolean | null>(null);

  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const savedZoneData = localStorage.getItem("savedZone");
    if (savedZoneData) {
      const zoneData = JSON.parse(savedZoneData);
      setSavedZone(zoneData);
    }
  }, []);

  // Obtener ubicación del usuario en tiempo real
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "No se pudo obtener la ubicación. Por favor, habilita los permisos de geolocalización."
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      alert("La geolocalización no es soportada por este navegador.");
    }
  }, []);

  // Verificar si el usuario está dentro o fuera de la zona
  useEffect(() => {
    if (savedZone && userLocation) {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(userLocation.lat, userLocation.lng),
        new google.maps.LatLng(savedZone.center.lat, savedZone.center.lng)
      );

      const isCurrentlyInside = distance <= savedZone.radius;

      if (isInsideZone === null || isCurrentlyInside !== isInsideZone) {
        setIsInsideZone(isCurrentlyInside);
        alert(
          isCurrentlyInside
            ? "Portador dentro de la zona"
            : "Portador fuera de la zona"
        );
      }
    }
  }, [userLocation, savedZone, isInsideZone]);

  function handleMapLoad(mapInstance: google.maps.Map) {
    if (savedZone) {
      const tempCircle = new google.maps.Circle({
        center: savedZone.center,
        radius: savedZone.radius,
      });

      const bounds = tempCircle.getBounds();
      if (bounds) {
        mapInstance.fitBounds(bounds);
      }
    }
  }

  return (
    <div>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={["geometry"]}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation || savedZone?.center || defaultCenter}
          zoom={12}
          onLoad={handleMapLoad}
        >
          {savedZone && (
            <Circle
              center={savedZone.center}
              radius={savedZone.radius}
              options={{
                fillColor: "lightgreen",
                fillOpacity: 0.4,
                strokeColor: "green",
                strokeWeight: 2,
                editable: false,
                draggable: false,
              }}
            />
          )}
          {userLocation && (
            <OverlayView
              position={userLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="w-4 h-4 bg-green-500 rounded-full absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      </LoadScript>
      {!savedZone && (
        <div style={{ marginTop: "10px", textAlign: "center", color: "#666" }}>
          No hay ninguna zona guardada.
        </div>
      )}
    </div>
  );
}
