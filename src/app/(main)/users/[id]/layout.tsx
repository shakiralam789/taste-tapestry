import UserProfilePage from '@/pages/UserProfilePage';
import { Layout } from '@/components/layout/Layout';

export default async function layout({ children }: { children: React.ReactNode }) {
  return (
    <Layout className="md:px-0 px-0 pt-0 md:pt-0">
      {children}
    </Layout>
  );
}
