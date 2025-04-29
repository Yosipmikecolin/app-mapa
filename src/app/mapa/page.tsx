"use client";

import { GoogleMap, LoadScript, Circle, Polygon, Marker } from "@react-google-maps/api";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 4.711,
  lng: -74.0721,
};

export default function Map() {
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);
  const [polygonPaths, setPolygonPaths] = useState<google.maps.LatLngLiteral[]>([]);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState("");
  const [unit, setUnit] = useState("meters");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isApiLoaded && map) {
      const savedZone = localStorage.getItem("savedZone");
      if (savedZone) {
        const zoneData = JSON.parse(savedZone);
        if (zoneData.radius && zoneData.center) {
          const newCircle = new google.maps.Circle({
            map: map,
            center: zoneData.center,
            radius: zoneData.radius,
            fillColor: "lightgreen",
            fillOpacity: 0.4,
            strokeColor: "green",
            strokeWeight: 2,
            editable: true,
            draggable: true,
          });
          setCircle(newCircle);
          map.fitBounds(newCircle.getBounds()!);
        }
      }
    }
  }, [isApiLoaded, map]);

  function handleMapLoad(mapInstance: google.maps.Map) {
    setMap(mapInstance);
    setIsApiLoaded(true);
  }

  function createCircleFromAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!address.trim()) return setError("Ingrese una dirección válida.");

    const radiusValue = parseFloat(radius);
    if (isNaN(radiusValue) || radiusValue <= 0) return setError("Radio no válido.");

    const radiusInMeters = unit === "kilometers" ? radiusValue * 1000 : radiusValue;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        const newCircle = new google.maps.Circle({
          map: map!,
          center: { lat: location.lat(), lng: location.lng() },
          radius: radiusInMeters,
          fillColor: "lightgreen",
          fillOpacity: 0.4,
          strokeColor: "green",
          strokeWeight: 2,
          editable: true,
          draggable: true,
        });
        setCircle(newCircle);
        setPolygon(null);
        setAddress("");
        setRadius("");
        map?.fitBounds(newCircle.getBounds()!);
      } else {
        setError("Dirección no encontrada.");
      }
    });
  }

  function deleteZone() {
    if (circle) circle.setMap(null);
    if (polygon) polygon.setMap(null);
    setCircle(null);
    setPolygon(null);
    localStorage.removeItem("savedZone");
  }

  function saveZone() {
    if (circle) {
      const zoneData = {
        center: {
          lat: circle.getCenter()!.lat(),
          lng: circle.getCenter()!.lng(),
        },
        radius: circle.getRadius(),
      };
      localStorage.setItem("savedZone", JSON.stringify(zoneData));
    }
  }

  function handleMapClick(e: google.maps.MapMouseEvent) {
    if (e.latLng && !circle) {
      const latLng = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setPolygonPaths((prev) => [...prev, latLng]);
    }
  }

  function createPolygon() {
    if (!map || polygonPaths.length < 3) return;
    const poly = new google.maps.Polygon({
      paths: polygonPaths,
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35,
      editable: true,
      draggable: true,
    });
    poly.setMap(map);
    setPolygon(poly);
    setCircle(null);
    setPolygonPaths([]);
  }

  return (
    <div className="flex h-[600px] w-full">
      <div className="w-[300px] bg-gray-100 p-4 space-y-4 overflow-y-auto">
        {!circle && !polygon && (
          <form onSubmit={createCircleFromAddress} className="space-y-2">
            <Input
              type="text"
              placeholder="Dirección"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Radio"
              min="0"
              step="any"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meters">Metros</SelectItem>
                <SelectItem value="kilometers">Kilómetros</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Crear Zona Circular</Button>
            {polygonPaths.length >= 3 && <Button onClick={createPolygon}>Crear Zona con Polígono</Button>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </form>
        )}
        {(circle || polygon) && (
          <div className="space-y-2">
            <Button onClick={saveZone}>Guardar Zona</Button>
            <Button onClick={deleteZone} variant="destructive">Eliminar Zona</Button>
          </div>
        )}
        {!circle && (
          <p className="text-sm text-gray-600">Haz clic en el mapa para definir puntos de un polígono.</p>
        )}
      </div>
      <div className="flex-1">
        <LoadScript
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={["geometry"]}
          onLoad={() => setIsApiLoaded(true)}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            onLoad={handleMapLoad}
            onClick={handleMapClick}
          >
            {polygonPaths.map((coord, idx) => (
              <Marker key={idx} position={coord} />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}