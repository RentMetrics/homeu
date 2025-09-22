import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuth>
      <AdminNavigation>
        {children}
      </AdminNavigation>
    </AdminAuth>
  );
} 