
'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Complaint } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
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

    const complaintsQuery = query(collection(db, "complaints"));

    const unsubscribe = onSnapshot(complaintsQuery, (snapshot) => {
      let allComplaints = snapshot.docs.map(doc => ({...doc.data(), id: doc.id }) as Complaint);
      
      let filteredComplaints = allComplaints;
      if (profile.role === 'admin' && profile.district) {
          const adminDistrict = profile.district.toLowerCase();
          filteredComplaints = allComplaints.filter(complaint => 
              (complaint.district?.toLowerCase() === adminDistrict) ||
              (complaint.location?.address?.toLowerCase().includes(adminDistrict))
          );
      }

      setComplaints(filteredComplaints);
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
        mapInstance.current = L.map(mapRef.current).setView([11.9416, 79.8083], 9); 
        
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
            if (validPoints.length > 0) {
              mapInstance.current.fitBounds(L.latLngBounds(validPoints), { padding: [50, 50], maxZoom: 14 });
            }
        } else {
             if(mapInstance.current) {
                mapInstance.current.setView([11.9416, 79.8083], 9);
             }
        }
    }
  }, [points]);
  
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
          An interactive heatmap showing the density of reported issues for your district.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[70vh] rounded-lg overflow-hidden relative">
           {loading ? (
             <Skeleton className="h-full w-full" />
           ) : (
             <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
           )}
           {!loading && complaints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <p className="text-muted-foreground bg-background p-4 rounded-md shadow-md">No complaints found for your district.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
