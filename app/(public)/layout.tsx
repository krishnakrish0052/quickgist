import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <PublicHeader />
      <main id="main" className="min-h-[60vh] bg-paper">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
