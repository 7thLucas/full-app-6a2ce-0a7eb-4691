import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--me-bg-primary)" }}
    >
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
