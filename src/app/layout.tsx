import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Taste Tapestry",
  description: "Capture and explore your emotional journey through movies, series, music, and more.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await cookies();
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
