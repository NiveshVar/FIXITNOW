import { Badge } from "@/components/ui/badge";
import { ComplaintStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type ComplaintStatusBadgeProps = {
  status: ComplaintStatus;
  className?: string;
};

const statusStyles: Record<ComplaintStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
  Resolved: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
};

export default function ComplaintStatusBadge({ status, className }: ComplaintStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
