"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function CreateAlbumPageInner() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/albums");
  }, [router]);

  return null;
}

export default function CreateAlbumPage() {
  // During static export/prerender this legacy page can be rendered
  // outside of the React Query provider. Avoid running client hooks on the server.
  if (typeof window === "undefined") {
    return null;
  }
  return <CreateAlbumPageInner />;
}


