
'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Skeleton } from './ui/skeleton';

const Heatmap = dynamic(() => import('@/components/heatmap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[70vh] w-full" />,
});

export default function HeatmapDynamic() {
    // We use useMemo to ensure the component is not re-rendered unnecessarily
    const HeatmapMemo = useMemo(() => <Heatmap />, []);
    return HeatmapMemo;
}
