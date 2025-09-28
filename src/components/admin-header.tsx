
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Map, LayoutDashboard } from "lucide-react";
import { Logo } from "./icons/logo";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminHeader() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const onLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      window.location.href = "/admin/login";
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "Something went wrong. Please try again.",
        });
    }
  };
  
  const getRoleDisplayName = () => {
    if (profile?.role === 'super-admin') return '[Super Admin]';
    if (profile?.role === 'admin') return `[Admin: ${profile.district}]`;
    return '';
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">FixIt Now - Admin</span>
      </div>
       <nav className="flex items-center gap-4 mx-6">
          <Link href="/admin/dashboard" className={cn("flex items-center gap-2 text-sm font-medium", pathname === "/admin/dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <LayoutDashboard />
            List View
          </Link>
           <Link href="/admin/dashboard/map-view" className={cn("flex items-center gap-2 text-sm font-medium", pathname === "/admin/dashboard/map-view" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Map />
            Map View
          </Link>
        </nav>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Welcome, <span className="font-medium text-foreground">{profile?.name}</span>
          {profile && <span className="ml-2 font-bold text-primary">{getRoleDisplayName()}</span>}
        </div>
        <Button variant="outline" size="icon" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}
