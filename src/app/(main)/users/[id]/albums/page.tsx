import UserAlbumsPage from "@/pages/UserAlbumsPage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <UserAlbumsPage id={id} />;
}
