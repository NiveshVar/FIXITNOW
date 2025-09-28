
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

// Dynamically import the Heatmap component with SSR disabled.
// This is the standard and correct way to handle client-only libraries like Leaflet in Next.js.
const Heatmap = dynamic(() => import('@/components/heatmap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[70vh] w-full" />,
});

export default function HeatmapDynamic() {
    return <Heatmap />;
}
