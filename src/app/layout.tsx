
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
// import { AuthProvider } from '@/contexts/auth-context'; // Removed AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Flyin.AI',
  description: 'A modern, responsive web application inspired by ChatGPT, focused on flights and travel.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* <AuthProvider> */} {/* Removed AuthProvider wrapper */}
          {children}
          <Toaster />
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}

