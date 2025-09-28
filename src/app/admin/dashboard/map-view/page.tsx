
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const HeatmapDynamic = dynamic(() => import('@/components/heatmap-dynamic'), {
  ssr: false,
  loading: () => <Skeleton className="h-[70vh] w-full" />,
});

export default function MapViewPage() {
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
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <HeatmapDynamic />
          </Suspense>
        </div>
      </CardContent>
    </Card>
  );
}
