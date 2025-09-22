import { Navigation } from "@/components/navigation";

export default function SettingsLayout({
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