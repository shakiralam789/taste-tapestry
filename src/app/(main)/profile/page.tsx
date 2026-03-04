"use client";
import MyCollections from "@/components/profile/MyCollections";
import ProfilePage from "@/components/pages/ProfilePage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ProfilePage>
      <div className="mt-0">
        <MyCollections />
      </div>
    </ProfilePage>
  );
}
