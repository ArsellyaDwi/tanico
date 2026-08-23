import { LayoutProvider } from '@/context/LayoutContext';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin Dashboard - Tanico',
  description: 'Sistem Manajemen Admin Tanico',
};

export default function AdminLayout({ children }) {
  return (
    <LayoutProvider>
      <AdminShell>{children}</AdminShell>
    </LayoutProvider>
  );
}

