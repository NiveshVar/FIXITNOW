
"use client";
import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Complaint, ComplaintStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ComplaintStatusBadge from "./complaint-status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { updateComplaintStatus } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Eye } from "lucide-react";
import IssueDetailsDialog from "./issue-details-dialog";
import { useAuth } from "@/hooks/use-auth";


export default function AllIssuesAdmin() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const { toast } = useToast();
  const [selectedComplaint, setSelectedComplaint] = React.useState<Complaint | null>(null);

  React.useEffect(() => {
    if (!profile) return;
    
    setLoading(true);
    
    let complaintsQuery;
    if (profile.role === 'super-admin') {
      // Super admin sees all complaints
      complaintsQuery = query(collection(db, "complaints"), orderBy("timestamp", "desc"));
    } else if (profile.role === 'admin' && profile.district) {
      // District admin sees complaints for their district and unassigned ones as a fallback
      complaintsQuery = query(
        collection(db, "complaints"),
        where("district", "in", [profile.district, "Unknown"]),
        orderBy("timestamp", "desc")
      );
    } else {
      // No profile or role, see nothing
      setLoading(false);
      return;
    }


    const unsubscribe = onSnapshot(complaintsQuery, (querySnapshot) => {
      const allComplaints: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        allComplaints.push({ id: doc.id, ...doc.data() } as Complaint);
      });
      setComplaints(allComplaints);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);
  
  const handleStatusChange = async (complaintId: string, status: ComplaintStatus) => {
    const result = await updateComplaintStatus(complaintId, status);
    if (result.success) {
      toast({ title: "Status Updated", description: `Complaint status changed to ${status}.` });
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  };

  const columns: ColumnDef<Complaint>[] = [
    {
      accessorKey: "title",
      header: "Issue",
      cell: ({ row }) => (
        <div className="capitalize font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div className="capitalize">{row.getValue("category")}</div>,
    },
    {
      accessorKey: "district",
      header: "District",
      cell: ({ row }) => <div className="capitalize">{row.getValue("district")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ComplaintStatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "location.address",
      header: "Address",
      cell: ({ row }) => <div className="truncate max-w-xs">{row.original.location.address}</div>,
    },
    {
      accessorKey: "timestamp",
      header: "Reported On",
      cell: ({ row }) => (
        <div>{row.original.timestamp?.toDate().toLocaleDateString()}</div>
      ),
    },
    {
      id: "statusUpdate",
      header: "Update Status",
      cell: ({ row }) => {
        const complaint = row.original;
        return (
          <Select
            defaultValue={complaint.status}
            onValueChange={(value) => handleStatusChange(complaint.id, value as ComplaintStatus)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const complaint = row.original;
            return (
                <Button variant="outline" size="icon" onClick={() => setSelectedComplaint(complaint)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Details</span>
                </Button>
            );
        },
    }
  ];

  const table = useReactTable({
    data: complaints,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>All Reported Issues</CardTitle>
        <CardDescription>Manage and update the status of all community-reported issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id.includes('.') ? column.id.split('.')[1] : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {loading ? "Loading complaints..." : "No results."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    {selectedComplaint && (
        <IssueDetailsDialog
            complaint={selectedComplaint}
            isOpen={!!selectedComplaint}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setSelectedComplaint(null);
                }
            }}
        />
    )}
    </>
  );
}
