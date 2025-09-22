import { Navigation } from "@/components/navigation";

export default function SetupLayout({
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