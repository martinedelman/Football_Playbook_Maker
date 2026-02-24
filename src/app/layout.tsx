import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flag Football Playbook Maker",
  description: "Create and manage flag football playbooks with ease",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
