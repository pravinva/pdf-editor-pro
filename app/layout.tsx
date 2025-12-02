import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PDF Editor Pro - Professional PDF Editing Tool',
  description: 'Edit, annotate, and enhance your PDF documents with our powerful online PDF editor',
  keywords: ['PDF editor', 'PDF annotation', 'PDF tools', 'online PDF editor'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
