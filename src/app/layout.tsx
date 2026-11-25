import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bayero University Clinic — Book Appointments Online",
    template: "%s · Bayero University Clinic",
  },
  description:
    "Book clinic appointments, reschedule, and message your doctor online. The official appointment platform of the Bayero University Kano Clinic.",
  keywords: ["Bayero University Clinic", "BUK Clinic", "appointment booking", "student health", "Kano", "university clinic"],
  authors: [{ name: "Bayero University Kano" }],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Bayero University Clinic",
    description: "Skip the queue — book your clinic appointment online at Bayero University Kano.",
    siteName: "Bayero University Clinic",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1512" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
