
'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Complaint } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState, useRef } from "react";

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
}


export default function MapView() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);


  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

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
      const fetchedComplaints = snapshot.docs.map(doc => ({...doc.data(), id: doc.id }) as Complaint);
      setComplaints(fetchedComplaints);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);
  
  const points: [number, number, number][] = useMemo(() =>
    complaints
      .filter(c => c.location?.lat && c.location?.long)
      .map(c => [c.location.lat, c.location.long, 1]),
    [complaints]
  );
  
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
        // Map is not initialized, so create it
        mapInstance.current = L.map(mapRef.current).setView([12.9716, 77.5946], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance.current);
    }
    
    if (mapInstance.current) {
        if (heatLayerRef.current) {
            mapInstance.current.removeLayer(heatLayerRef.current);
        }

        if (points.length > 0) {
            heatLayerRef.current = L.heatLayer(points as L.LatLngTuple[], {
                radius: 25,
                blur: 15,
                maxZoom: 18,
                gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
            }).addTo(mapInstance.current);

            const validPoints = points.map(p => L.latLng(p[0], p[1]));
            mapInstance.current.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50], maxZoom: 14 });
        }
    }
  }, [points]);
  
  // Cleanup map instance on component unmount
  useEffect(() => {
      return () => {
          if (mapInstance.current) {
              mapInstance.current.remove();
              mapInstance.current = null;
          }
      };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Hotspots</CardTitle>
        <CardDescription>
          An interactive heatmap showing the density of reported issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[70vh] rounded-lg overflow-hidden">
           {loading ? <Skeleton className="h-full w-full" /> : <div ref={mapRef} style={{ height: '100%', width: '100%' }} />}
        </div>
      </CardContent>
    </Card>
  );
}
