"use client";
import Talent from "@/components/profile/Talent";
import ProfilePage from "@/pages/ProfilePage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ProfilePage>
      <div className="mt-0">
        <Talent />
      </div>
    </ProfilePage>
  );
}
