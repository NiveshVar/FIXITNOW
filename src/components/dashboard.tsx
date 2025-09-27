"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportIssueForm } from "@/components/report-issue-form";
import MyIssues from "@/components/my-issues";
import { useAuth } from "@/hooks/use-auth";
import AllIssuesAdmin from "@/components/all-issues-admin";
import Chatbot from "@/components/chatbot";
import type { ReportPrefill } from "@/lib/types";

export default function Dashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("report");
  const [chatbotData, setChatbotData] = useState<ReportPrefill | null>(null);

  const handleChatbotSubmit = (data: ReportPrefill) => {
    setChatbotData(data);
    setActiveTab("report");
  };

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
            <TabsTrigger value="report">Report Issue</TabsTrigger>
            <TabsTrigger value="track">My Issues</TabsTrigger>
            {profile?.role === 'admin' && <TabsTrigger value="admin">Admin Dashboard</TabsTrigger>}
          </TabsList>
          <TabsContent value="report">
            <ReportIssueForm prefillData={chatbotData} onClearPrefill={() => setChatbotData(null)} />
          </TabsContent>
          <TabsContent value="track">
            <MyIssues />
          </TabsContent>
          {profile?.role === 'admin' && (
            <TabsContent value="admin">
              <AllIssuesAdmin />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Chatbot onSubmit={handleChatbotSubmit} />
    </main>
  );
}
