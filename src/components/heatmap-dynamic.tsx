
'use client';

import L from 'leaflet';
import 'leaflet.heat';
import type { LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';

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

  function heatLayer(latlngs: (L.LatLng | L.LatLngTuple)[], options?: HeatLayerOptions): any;
  
  interface Map {
    _hotspots?: any;
  }
}

const HeatLayerComponent = ({ points }: { points: (L.LatLng | L.LatLngTuple)[] }) => {
  const map = useMap();

  useEffect(() => {
    // Remove previous heatmap layer if it exists
    if (map._hotspots) {
      map.removeLayer(map._hotspots);
    }

    if (points.length > 0) {
      const heat = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 18,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      }).addTo(map);
      
      // Store the layer on the map instance
      map._hotspots = heat;

      const validPoints = points.map(p => L.latLng(p[0], p[1]));
      if (validPoints.length > 0) {
        map.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50], maxZoom: 14 });
      }
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
