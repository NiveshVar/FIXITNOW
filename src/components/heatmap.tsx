
"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet.heat';
import type { LatLngExpression } from 'leaflet';


// Augment the Leaflet module
declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(latlngs: LatLngExpression[], options?: HeatLayerOptions): any;
}


const HeatLayerComponent = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const heat = (L as any).heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 18,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [points, map]);

  return null;
};


const Heatmap = ({ points }: { points: [number, number, number][] }) => {
  return (
      <MapContainer center={[12.9716, 77.5946]} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <HeatLayerComponent points={points} />
      </MapContainer>
  );
};

export default Heatmap;
