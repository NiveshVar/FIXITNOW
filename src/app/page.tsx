"use client";

import { useAuth } from "@/hooks/use-auth";
import AuthPage from "@/components/auth-page";
import Dashboard from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/header";
import { Logo } from "@/components/icons/logo";

export default function Home() {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6" />
            <span className="text-lg font-bold">FixIt Now</span>
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
      {user && profile ? (
        <>
          <Header />
          <Dashboard />
        </>
      ) : (
        <AuthPage />
      )}
    </div>
  );
}
