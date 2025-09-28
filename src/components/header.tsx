
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Bell } from "lucide-react";
import { Logo } from "./icons/logo";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { markNotificationsAsRead } from "@/app/actions";
import { Badge } from "./ui/badge";

type Notification = {
    id: string;
    complaintTitle: string;
    message: string;
    timestamp: any;
    isRead: boolean;
}

export default function Header() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        
        // Sort notifications by timestamp client-side (newest first)
        notifs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

        setNotifications(notifs);
        const unread = notifs.filter(n => !n.isRead).length;
        setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  const onLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      window.location.reload();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: "Something went wrong. Please try again.",
        });
    }
  };

  const handleOpenNotifications = async () => {
    if (unreadCount > 0 && user) {
        await markNotificationsAsRead(user.uid);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2 font-semibold">
        <Logo className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">FixIt Now</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Welcome, <span className="font-medium text-foreground">{profile?.name}</span>
          {profile?.role === 'admin' && <span className="ml-2 font-bold text-primary">[Admin]</span>}
        </div>
        <Popover onOpenChange={(open) => { if(open) handleOpenNotifications()}}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                            Recent updates on your reports.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        {notifications.length > 0 ? (
                           notifications.map(notif => (
                            <div key={notif.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0">
                                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium">{notif.complaintTitle}</p>
                                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground">{notif.timestamp?.toDate().toLocaleString()}</p>
                                </div>
                            </div>
                           ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No new notifications.</p>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}
