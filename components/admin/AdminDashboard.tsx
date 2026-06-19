"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAdmin } from "@/components/admin/AdminProvider";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDuasTab } from "@/components/admin/tabs/AdminDuasTab";
import { AdminGuestsTab } from "@/components/admin/tabs/AdminGuestsTab";
import { AdminMessagesTab } from "@/components/admin/tabs/AdminMessagesTab";
import { AdminOverviewTab } from "@/components/admin/tabs/AdminOverviewTab";
import { AdminPhotosTab } from "@/components/admin/tabs/AdminPhotosTab";
import { AdminQuestionnaireTab } from "@/components/admin/tabs/AdminQuestionnaireTab";
import { AdminResetTab } from "@/components/admin/tabs/AdminResetTab";
import { AdminVideosTab } from "@/components/admin/tabs/AdminVideosTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "guests", label: "Guests" },
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
  { id: "duas", label: "Duas" },
  { id: "messages", label: "Advice" },
  { id: "questionnaire", label: "Results" },
  { id: "reset", label: "Reset" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function AdminDashboardContent() {
  const { secret, clearSecret } = useAdmin();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabParam) ? tabParam : "overview";

  if (!secret) {
    return <AdminLogin />;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <h1 className="flow-title">Henna Night Admin</h1>
          <p className="flow-subtitle">Manage guest content and test data</p>
        </div>
        <button type="button" className="flow-btn flow-btn--secondary" onClick={clearSecret}>
          Sign out
        </button>
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={`/admin?tab=${tab.id}`}
            className={`admin-nav__link ${activeTab === tab.id ? "admin-nav__link--active" : ""}`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <main className="admin-dashboard__content">
        {activeTab === "overview" && <AdminOverviewTab />}
        {activeTab === "guests" && <AdminGuestsTab />}
        {activeTab === "photos" && <AdminPhotosTab />}
        {activeTab === "videos" && <AdminVideosTab />}
        {activeTab === "duas" && <AdminDuasTab />}
        {activeTab === "messages" && <AdminMessagesTab />}
        {activeTab === "questionnaire" && <AdminQuestionnaireTab />}
        {activeTab === "reset" && <AdminResetTab />}
      </main>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <Suspense fallback={<p className="flow-loading">Loading admin…</p>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
