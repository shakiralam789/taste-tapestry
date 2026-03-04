"use client";
import Talents from '@/components/user-profile/Talents';
import UserProfilePage from '@/components/pages/UserProfilePage';
export default function page() {
  return (
    <UserProfilePage>
      <Talents />
    </UserProfilePage>
  )
}
