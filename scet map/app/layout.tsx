import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusPath | SCET Smart Indoor Navigation',
  description:
    'Suryodaya College of Engineering & Technology — QR-assisted indoor campus navigation, interactive floor maps, and classroom finder.',
  keywords: [
    'SCET',
    'Suryodaya College of Engineering & Technology',
    'Indoor Navigation',
    'Campus Navigation',
    'College Map',
    'Classroom Finder',
    'QR Navigation',
  ],
  authors: [{ name: 'SCET Engineering Team' }],
};

export const viewport: Viewport = {
  themeColor: '#14213d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
