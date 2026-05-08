import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CSWProvider } from "@codeswayam/auth";
import { EmsProvider } from "@/components/providers/EmsProvider";
import { ConditionalAuthGuard } from "@/components/providers/ConditionalAuthGuard";
import { ClientLayout } from "@/components/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EMS - Employee Management System",
  description: "Manage employees, tasks, meetings, and time tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
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
