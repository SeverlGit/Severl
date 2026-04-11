import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Your dedicated client portal",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f5f3] font-sans">
      {children}
    </div>
  );
}
