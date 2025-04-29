"use client";

import { GoogleMap, LoadScript, DrawingManager, Circle } from "@react-google-maps/api";
import { useState, useEffect } from "react";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const center = {
  lat: 4.711,
  lng: -74.0721,
};

export default function Map() {
  const [drawingModes, setDrawingModes] = useState<
    google.maps.drawing.OverlayType[]
  >([]); // Inicializamos como array vacío
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false); // Estado para verificar carga de API

  // Cargar círculo desde localStorage al iniciar
  useEffect(() => {
    if (isApiLoaded && map) {
      const savedZone = localStorage.getItem("savedZone");
      if (savedZone) {
        const zoneData = JSON.parse(savedZone);
        const newCircle = new google.maps.Circle({
          map: map,
          center: { lat: zoneData.center.lat, lng: zoneData.center.lng },
          radius: zoneData.radius,
          fillColor: "lightgreen",
          fillOpacity: 0.4,
          strokeColor: "green",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        });
        setCircle(newCircle);
        setDrawingModes([]); // Mantener control de dibujo oculto
      }
    }
  }, [isApiLoaded, map]);

  function handleMapLoad(mapInstance: google.maps.Map) {
    setMap(mapInstance);
    setIsApiLoaded(true); // Indicamos que la API está cargada
  }

  function handleCircleComplete(newCircle: google.maps.Circle) {
    setCircle(newCircle);
    setDrawingModes([]); // Oculta el control de dibujo

    console.log("Círculo creado:", {
      center: {
        lat: newCircle.getCenter()?.lat(),
        lng: newCircle.getCenter()?.lng(),
      },
      radius: newCircle.getRadius(),
    });

    newCircle.setEditable(true);
    newCircle.setDraggable(true);
  }

  function deleteCircle() {
    if (circle) {
      circle.setMap(null); // Elimina el círculo del mapa
      setCircle(null);
      setDrawingModes([]); // Mantiene el control de dibujo oculto y modo sin crear
      localStorage.removeItem("savedZone"); // Elimina la zona guardada
    }
  }

  function startDrawing() {
    if (window.google && window.google.maps.drawing) {
      setDrawingModes([window.google.maps.drawing.OverlayType.CIRCLE]); // Activa el modo de dibujo
    }
  }

  function saveZone() {
    if (circle) {
      const zoneData = {
        center: {
          lat: circle.getCenter()?.lat(),
          lng: circle.getCenter()?.lng(),
        },
        radius: circle.getRadius(),
      };
      localStorage.setItem("savedZone", JSON.stringify(zoneData));
      console.log("Zona guardada en localStorage:", zoneData);
    }
  }

  return (
    <div>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={["drawing"]}
        onLoad={() => setIsApiLoaded(true)} // Marcamos la API como cargada
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onLoad={handleMapLoad}
        >
          {isApiLoaded && (
            <DrawingManager
              drawingMode={
                drawingModes.length > 0
                  ? google.maps.drawing.OverlayType.CIRCLE
                  : null
              }
              options={{
                drawingControl: drawingModes.length > 0, // Mostrar control solo si hay modos de dibujo
                drawingControlOptions: {
                  drawingModes: drawingModes,
                  position: google.maps.ControlPosition.TOP_CENTER,
                },
                circleOptions: {
                  fillColor: "lightgreen",
                  fillOpacity: 0.4,
                  strokeColor: "green",
                  strokeWeight: 2,
                  editable: true,
                  draggable: true,
                },
              }}
              onCircleComplete={handleCircleComplete}
            />
          )}
        </GoogleMap>
      </LoadScript>
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        {!circle && (
          <button
            onClick={startDrawing}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              marginRight: "10px",
            }}
          >
            Crear Zona
          </button>
        )}
        {circle && (
          <>
            <button
              onClick={saveZone}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                marginRight: "10px",
              }}
            >
              Guardar Zona
            </button>
            <button
              onClick={deleteCircle}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Eliminar Zona
            </button>
          </>
        )}
      </div>
    </div>
  );
}