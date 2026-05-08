import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CSWProvider } from "@codeswayam/auth";
import { EmsProvider } from "@/components/providers/EmsProvider";
import { ConditionalAuthGuard } from "@/components/providers/ConditionalAuthGuard";
import { ClientLayout } from "@/components/ClientLayout";
import { Analytics } from "@codeswayam/analytics";
import { SwRegister } from "@/components/SwRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EMS - Employee Management System",
  description: "Manage employees, tasks, meetings, and time tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMS System",
  },
  icons: {
    apple: "/icon-192x192.png",
    icon: "/icon-192x192.png",
  },
};

// viewport must be exported separately in Next.js 14+
export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Required for iOS PWA install */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EMS System" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Analytics
          gtmId={process.env.NEXT_PUBLIC_GTM_ID}
          ga4Id={process.env.NEXT_PUBLIC_GA4_ID}
          metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
          appName="ems"
        />
        {/* Registers /sw.js for push notifications */}
        <SwRegister />
        <CSWProvider
          apiUrl={process.env.NEXT_PUBLIC_API_URL}
          ssoUrl={process.env.NEXT_PUBLIC_APP_AUTH_URL}
        >
          <ConditionalAuthGuard>
            <EmsProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <Toaster richColors position="top-right" />
            </EmsProvider>
          </ConditionalAuthGuard>
        </CSWProvider>
      </body>
    </html>
  );
}
