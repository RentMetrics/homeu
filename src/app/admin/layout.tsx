import { Navigation } from "@/components/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Navigation>
      {children}
    </Navigation>
  );
} 