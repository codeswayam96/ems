import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "sonner";
import { CSWProvider } from "@codeswayam/auth";
import { EmsProvider } from "@/components/providers/EmsProvider";
import { ConditionalAuthGuard } from "@/components/providers/ConditionalAuthGuard";

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
      <body className={`${inter.variable} antialiased flex min-h-screen bg-muted/30`}>
        <CSWProvider 
          apiUrl={process.env.NEXT_PUBLIC_API_URL} 
          ssoUrl={process.env.NEXT_PUBLIC_APP_AUTH_URL}
        >
          <ConditionalAuthGuard>
            <EmsProvider>
              <Sidebar />
              <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-[1400px] mx-auto">
                  {children}
                </div>
              </main>
              <Toaster richColors position="top-right" />
            </EmsProvider>
          </ConditionalAuthGuard>
        </CSWProvider>
      </body>
    </html>
  );
}
