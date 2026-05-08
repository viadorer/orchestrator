import type { Metadata, Viewport } from 'next';

/**
 * Mobile-first upload route. Has its own layout so the admin Sidebar from
 * `/page.tsx` is NOT rendered here — the page is meant to be added to the
 * iPhone home screen and used standalone. The root layout still applies
 * (HTML / body / fonts / AuthProvider).
 */

export const metadata: Metadata = {
  title: 'Nahrát fotku',
  description: 'Nahraj fotku do sdílené knihovny — automatické otagování AI.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F172A',
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
