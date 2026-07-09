import FeedPage from "@/components/pages/FeedPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return <FeedPage filter="all" showComposer />;
}
