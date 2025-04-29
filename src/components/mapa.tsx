"use client";
import {
  GoogleMap,
  LoadScript,
  DrawingManager,
} from "@react-google-maps/api";
import { useState, useMemo, useRef } from "react";

export default function Map() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingMode, setDrawingMode] = useState<"CIRCLE" | "POLYGON" | null>(null);
  const [shapeCoords, setShapeCoords] = useState<string[]>([]);
  const [shapeCreated, setShapeCreated] = useState<boolean>(false);
  const shapeRef = useRef<google.maps.Circle | google.maps.Polygon | null>(null);

  const center = useMemo(() => ({ lat: 4.711, lng: -74.0721 }), []);

  const handleOverlayComplete = (e: google.maps.drawing.OverlayCompleteEvent) => {
    // Evitar crear más de una figura
    if (shapeCreated) {
      e.overlay.setMap(null);
      return;
    }

    // Guardar referencia
    shapeRef.current = e.overlay as google.maps.Circle | google.maps.Polygon;
    setShapeCreated(true);
    setDrawingMode(null); // Desactiva modo dibujo

    if (e.type === window.google.maps.drawing.OverlayType.CIRCLE) {
      const circle = e.overlay as google.maps.Circle;
      const center = circle.getCenter();
      const radius = circle.getRadius();
      setShapeCoords([`Centro: (${center.lat().toFixed(5)}, ${center.lng().toFixed(5)})`, `Radio: ${radius.toFixed(2)} metros`]);
    }

    if (e.type === window.google.maps.drawing.OverlayType.POLYGON) {
      const polygon = e.overlay as google.maps.Polygon;
      const path = polygon.getPath();
      const coords: string[] = [];
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coords.push(`(${point.lat().toFixed(5)}, ${point.lng().toFixed(5)})`);
      }
      setShapeCoords(coords);
    }
  };

  const clearShape = () => {
    if (shapeRef.current) {
      shapeRef.current.setMap(null);
      shapeRef.current = null;
    }
    setShapeCoords([]);
    setShapeCreated(false);
    setDrawingMode(null);
  };

  const saveShape = () => {
    alert("Zona guardada:\n" + shapeCoords.join("\n"));
    localStorage.setItem("savedZone",JSON.stringify(center))
  };

  const drawingOptions = useMemo(() => {
    if (typeof window === "undefined" || !window.google || drawingMode === null) return undefined;

    return {
      drawingControl: false,
      drawingMode: window.google.maps.drawing.OverlayType[drawingMode],
      circleOptions: {
        fillColor: "lightgreen",
        fillOpacity: 0.4,
        strokeColor: "green",
        strokeWeight: 2,
        editable: false,
        clickable: false,
      },
      polygonOptions: {
        fillColor: "lightblue",
        fillOpacity: 0.4,
        strokeColor: "blue",
        strokeWeight: 2,
        editable: false,
        clickable: false,
      },
    };
  }, [drawingMode]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "300px",
          padding: "1rem",
          background: "#f1f1f1",
          overflowY: "auto",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Selecciona una forma</h2>
        <div style={{ marginBottom: "1rem" }}>
          <button
            onClick={() => setDrawingMode("CIRCLE")}
            disabled={shapeCreated || drawingMode === "POLYGON"}
            style={{
              marginBottom: "0.5rem",
              padding: "0.5rem 1rem",
              background: drawingMode === "CIRCLE" ? "#4CAF50" : "#ddd",
              color: drawingMode === "CIRCLE" ? "#fff" : "#000",
              border: "none",
              cursor: shapeCreated || drawingMode === "POLYGON" ? "not-allowed" : "pointer",
              width: "100%",
              opacity: shapeCreated || drawingMode === "POLYGON" ? 0.5 : 1,
            }}
          >
            Círculo
          </button>
          <button
            onClick={() => setDrawingMode("POLYGON")}
            disabled={shapeCreated || drawingMode === "CIRCLE"}
            style={{
              padding: "0.5rem 1rem",
              background: drawingMode === "POLYGON" ? "#2196F3" : "#ddd",
              color: drawingMode === "POLYGON" ? "#fff" : "#000",
              border: "none",
              cursor: shapeCreated || drawingMode === "CIRCLE" ? "not-allowed" : "pointer",
              width: "100%",
              opacity: shapeCreated || drawingMode === "CIRCLE" ? 0.5 : 1,
            }}
          >
            Polígono
          </button>
        </div>

        <h3>Datos de la figura</h3>
        {shapeCoords.length === 0 ? (
          <p>Dibuja una figura en el mapa para ver los datos aquí.</p>
        ) : (
          <ul>
            {shapeCoords.map((coord, idx) => (
              <li key={idx}>{coord}</li>
            ))}
          </ul>
        )}

        {shapeCreated && (
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={saveShape}
              style={{
                marginBottom: "0.5rem",
                padding: "0.5rem 1rem",
                background: "#28a745",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Guardar zona
            </button>
            <button
              onClick={clearShape}
              style={{
                padding: "0.5rem 1rem",
                background: "#dc3545",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Eliminar zona
            </button>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div style={{ flex: 1 }}>
        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["drawing"]}
        >
          <GoogleMap
            center={center}
            zoom={15}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            onLoad={(mapInstance) => setMap(mapInstance)}
          >
            {drawingOptions && (
              <DrawingManager
                onOverlayComplete={handleOverlayComplete}
                options={drawingOptions}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}
