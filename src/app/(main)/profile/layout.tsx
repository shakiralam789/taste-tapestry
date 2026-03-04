import { Layout } from "@/components/layout/Layout";
import ProfilePage from "@/components/pages/ProfilePage";
import React from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout className="md:px-0 px-0 pt-0 md:pt-0">{children}</Layout>;
}
