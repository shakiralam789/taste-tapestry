"use client";
import Collections from "@/components/user-profile/Collections";
import UserProfilePage from "@/pages/UserProfilePage";
export const dynamic = "force-dynamic";

export default function Page() {
  return <UserProfilePage>
    <Collections />
  </UserProfilePage>;
}
