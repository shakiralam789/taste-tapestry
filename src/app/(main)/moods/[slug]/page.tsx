import MoodPage from "@/components/pages/MoodPage";

export const dynamic = "force-dynamic";

interface MoodSlugPageProps {
  params: { slug: string };
}

export default function MoodSlugPage({ params }: MoodSlugPageProps) {
  return <MoodPage initialMood={params.slug} />;
}
