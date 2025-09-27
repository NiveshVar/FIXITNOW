
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import React from "react";
import AdminHeader from "@/components/admin-header";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    
    if (loading) {
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

    if (!profile || profile.role !== 'admin') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You do not have permission to view this page. Please ensure you are logged in with an admin account.</p>
            <div className="mt-6 flex gap-4">
              <Button asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
               <Button variant="outline" asChild>
                <Link href="/admin/login">Admin Login</Link>
              </Button>
            </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    );
}
