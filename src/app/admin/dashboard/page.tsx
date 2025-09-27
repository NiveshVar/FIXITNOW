
"use client";

import AllIssuesAdmin from "@/components/all-issues-admin";
import AdminHeader from "@/components/admin-header";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/icons/logo";

export default function AdminDashboardPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== 'admin')) {
            router.push('/admin/login');
        }
    }, [profile, loading, router]);


    if (loading || !profile || profile.role !== 'admin') {
         return (
          <div className="flex flex-col min-h-screen">
            <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
              <div className="flex items-center gap-2 font-semibold">
                <Logo className="h-6 w-6" />
                <span className="text-lg font-bold">FixIt Now - Admin</span>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
              <div className="space-y-4">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </main>
          </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <AllIssuesAdmin />
                </div>
            </main>
        </div>
    );
}
