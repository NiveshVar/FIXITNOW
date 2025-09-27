

import AllIssuesAdmin from "@/components/all-issues-admin";
import AdminHeader from "@/components/admin-header";

export default function AdminDashboardPage() {
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
