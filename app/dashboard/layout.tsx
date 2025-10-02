"use client";

import Header from "@/components/Header";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
