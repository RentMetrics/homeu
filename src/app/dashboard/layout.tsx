import { Navigation } from "@/components/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Navigation>
      {/* Add My Application link to sidebar */}
      {/* The Navigation component should be updated to include this if not already dynamic */}
      {children}
    </Navigation>
  );
} 