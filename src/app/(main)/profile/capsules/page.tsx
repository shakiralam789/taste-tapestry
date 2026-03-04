"use client";
import Capsules from "@/components/profile/Capsules";
import ProfilePage from "@/components/pages/ProfilePage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ProfilePage>
      <div className="mt-0">
        <Capsules />
      </div>
    </ProfilePage>
  );
}
