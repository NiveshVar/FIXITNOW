
'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Complaint } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

// Dynamically import the Heatmap component with SSR disabled.
const Heatmap = dynamic(() => import('@/components/heatmap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[70vh] w-full" />,
});

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
    return (
        <Card>
            <CardHeader>
                <CardTitle>Issue Hotspots</CardTitle>
                <CardDescription>
                An interactive heatmap showing the density of reported issues in your area.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[70vh] w-full" />
            </CardContent>
        </Card>
    )
  }

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
             <Heatmap points={points} />
          </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapDynamic;
