
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Complaint } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet.heat';
import type { LatLngExpression } from 'leaflet';
import { Skeleton } from './ui/skeleton';

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
      
      const validPoints = points.map(p => L.latLng(p[0], p[1]));
      if (validPoints.length > 0) {
        map.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50] });
      }

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [points, map]);

  return null;
};


const HeatmapDynamic = () => {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    let complaintsQuery;
    if (profile.role === 'super-admin') {
      complaintsQuery = query(collection(db, "complaints"));
    } else if (profile.role === 'admin' && profile.district) {
      complaintsQuery = query(collection(db, "complaints"), where("district", "==", profile.district));
    } else {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(complaintsQuery, (snapshot) => {
      const fetchedComplaints = snapshot.docs.map(doc => doc.data() as Complaint);
      setComplaints(fetchedComplaints);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const points: [number, number, number][] = useMemo(() =>
    complaints
      .filter(c => c.location?.lat && c.location?.long)
      .map(c => [c.location.lat, c.location.long, 1]), // intensity of 1 for each complaint
    [complaints]
  );

  if (loading) {
      return <Skeleton className="h-full w-full" />;
  }

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

export default HeatmapDynamic;
