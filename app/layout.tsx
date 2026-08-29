import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { appConfig } from "@/config/app.config";
import { Providers } from "./providers";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: appConfig.title,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.description,
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
