
'use client';

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllIssuesAdmin from "./all-issues-admin";
import MapView from "./map-view";

export default function AdminDashboardTabs() {
  const [activeTab, setActiveTab] = useState("list-view");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list-view">List View</TabsTrigger>
        <TabsTrigger value="map-view">Map View</TabsTrigger>
      </TabsList>
      <TabsContent value="list-view">
        <AllIssuesAdmin />
      </TabsContent>
      <TabsContent value="map-view">
        {activeTab === 'map-view' && <MapView />}
      </TabsContent>
    </Tabs>
  );
}
