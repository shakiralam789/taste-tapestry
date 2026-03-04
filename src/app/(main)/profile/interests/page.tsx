"use client";
import Interests from "@/components/profile/Interests";
import ProfilePage from "@/components/pages/ProfilePage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ProfilePage>
      <div className="mt-0">
        <Interests />
      </div>
    </ProfilePage>
  );
}
