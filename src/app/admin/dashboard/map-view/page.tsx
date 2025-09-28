
import HeatmapDynamic from "@/components/heatmap-dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MapViewPage() {
    return (
        <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
            <HeatmapDynamic />
        </Suspense>
    );
}
