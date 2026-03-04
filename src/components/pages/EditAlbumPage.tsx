"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientOnly } from "@/components/common/ClientOnly";

function EditAlbumPageInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/albums");
  }, [router]);

  return null;
}

export default function EditAlbumPage() {
  return (
    <ClientOnly>
      <EditAlbumPageInner />
    </ClientOnly>
  );
}

