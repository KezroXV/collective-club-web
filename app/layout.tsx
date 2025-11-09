import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/theme.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ShopifyAuthProviderWrapper } from "@/components/providers/shopify-auth-provider-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collective Club - Forum Community",
  description: "Forum communautaire pour votre boutique Shopify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ShopifyAuthProviderWrapper>
            <ThemeProvider>
              <div className="min-h-screen bg-background font-sans antialiased">
                {children}
              </div>
              <Toaster position="bottom-right" />
            </ThemeProvider>
          </ShopifyAuthProviderWrapper>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
