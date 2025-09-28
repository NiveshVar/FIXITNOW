
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Complaint } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

export default function MapViewPage() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const Heatmap = useMemo(() => dynamic(() => import('@/components/heatmap-dynamic'), {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }), []);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Hotspots</CardTitle>
        <CardDescription>
          An interactive heatmap showing the density of reported issues in your area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[70vh] rounded-lg overflow-hidden">
           {loading ? <Skeleton className="h-full w-full" /> : <Heatmap points={points} />}
        </div>
      </CardContent>
    </Card>
  );
}
