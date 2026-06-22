"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { PolicyGuard } from "@/components/PolicyGuard";
import { Loader2 } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/auth/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <div className="print:hidden">
        <Header showNav />
      </div>
      {/* Spacer to offset the fixed header height */}
      <div className="h-16 print:hidden" />
      <PolicyGuard>
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      </PolicyGuard>
      <Footer />
    </>
  );
}
