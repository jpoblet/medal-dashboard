import type { Metadata } from "next";
import { Onest, Arvo } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TempoInit } from "@/components/tempo-init";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-sans", // For Tailwind
});

const arvo = Arvo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif", // For Tailwind
});

export const metadata: Metadata = {
  title: "Medal ",
  description: "Sport Competition Management Plaform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${onest.variable} ${arvo.variable}`}
      suppressHydrationWarning
    >
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
        <TempoInit />
      </body>
    </html>
  );
}
