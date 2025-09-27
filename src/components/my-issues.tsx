
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Complaint } from "@/lib/types";
import ComplaintCard from "@/components/complaint-card";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export default function MyIssues() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, "complaints"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userComplaints: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        userComplaints.push({ id: doc.id, ...doc.data() } as Complaint);
      });
      
      // Sort complaints by timestamp client-side
      userComplaints.sort((a, b) => {
        const dateA = a.timestamp?.toDate()?.getTime() || 0;
        const dateB = b.timestamp?.toDate()?.getTime() || 0;
        return dateB - dateA;
      });

      setComplaints(userComplaints);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Reported Issues</CardTitle>
        <CardDescription>Here is a list of all the issues you have reported. Statuses are updated in real-time.</CardDescription>
      </CardHeader>
      <div className="p-6 pt-0">
        {loading ? (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
           </div>
        ) : complaints.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>You haven't reported any issues yet.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
