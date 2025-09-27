import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Complaint } from "@/lib/types";
import ComplaintStatusBadge from "./complaint-status-badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, MapPin, User, Calendar } from "lucide-react";

type ComplaintCardProps = {
  complaint: Complaint;
};

export default function ComplaintCard({ complaint }: ComplaintCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        {complaint.photoURL ? (
          <div className="aspect-video relative w-full rounded-t-lg overflow-hidden mb-4">
            <Image
              src={complaint.photoURL}
              alt={complaint.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video relative w-full rounded-t-lg overflow-hidden mb-4 bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No Image</p>
          </div>
        )}
        <CardTitle>{complaint.title}</CardTitle>
        <CardDescription as="div" className="flex items-center gap-2 pt-1">
          <ComplaintStatusBadge status={complaint.status} />
          <span className="capitalize text-xs text-muted-foreground">{complaint.category}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {complaint.duplicateOf && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Duplicate Issue</AlertTitle>
                <AlertDescription>
                    This issue was marked as a duplicate. No further action will be taken.
                </AlertDescription>
            </Alert>
        )}
        <p className="text-sm text-muted-foreground">{complaint.description}</p>
        <div className="text-sm text-muted-foreground flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{complaint.location.address}</span>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-between">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <span>{complaint.userName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          <span>{complaint.timestamp?.toDate().toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
