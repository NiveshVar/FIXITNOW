
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Complaint } from "@/lib/types";
import ComplaintStatusBadge from "./complaint-status-badge";
import { Calendar, MapPin, User, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type IssueDetailsDialogProps = {
  complaint: Complaint;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function IssueDetailsDialog({ complaint, isOpen, onOpenChange }: IssueDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{complaint.title}</DialogTitle>
          <DialogDescription as="div" className="flex items-center gap-4 pt-1">
            <ComplaintStatusBadge status={complaint.status} />
            <span className="capitalize text-xs text-muted-foreground">{complaint.category}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
                {complaint.photoURL ? (
                    <div className="aspect-video relative w-full rounded-lg overflow-hidden">
                        <Image
                        src={complaint.photoURL}
                        alt={complaint.title}
                        fill
                        className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="aspect-video relative w-full rounded-lg bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">No Image Provided</p>
                    </div>
                )}
                 {complaint.duplicateOf && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Duplicate Issue</AlertTitle>
                        <AlertDescription>
                            This was marked as a duplicate. No further action will be taken.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{complaint.description}</p>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">Details</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{complaint.location.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span>Reported by {complaint.userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>on {complaint.timestamp?.toDate().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
