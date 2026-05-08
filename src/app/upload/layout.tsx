import type { Metadata, Viewport } from 'next';

/**
 * Mobile-first upload route. Has its own layout so the admin Sidebar from
 * `/page.tsx` is NOT rendered here — the page is meant to be added to the
 * iPhone home screen and used standalone. The root layout still applies
 * (HTML / body / fonts / AuthProvider).
 */

export const metadata: Metadata = {
  title: 'Nahrát do knihovny',
  description: 'Nahraj fotky a videa z iPhonu do sdílené knihovny — automatické AI tagování.',
  // iOS-only meta hints — let Safari treat this as a standalone PWA when
  // the user picks "Add to Home Screen". The page then opens without the
  // browser chrome, which is much closer to a native upload experience.
  appleWebApp: {
    capable: true,
    title: 'Nahrát',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F172A',
  viewportFit: 'cover',
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
