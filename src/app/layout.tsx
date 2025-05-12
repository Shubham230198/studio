import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PromptFlow', // Updated app name
  description: 'A modern, responsive web application inspired by ChatGPT.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Apply dark class to html for default dark theme */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster /> {/* Added Toaster component */}
      </body>
    </html>
  );
}
