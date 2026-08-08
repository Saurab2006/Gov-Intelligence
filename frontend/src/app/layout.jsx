import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from 'sonner';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const metadata = {
  title: 'Civicदृष्टि - Civic Service Accountability Platform',
  description: 'Human-centered ward reporting, verification, authority assignment, and public resolution tracking for Nepal',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-512.svg',
  },
};

export const viewport = {
  themeColor: '#0f3d3e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5f1e8] text-[#102a2b] antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
            <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 12, fontSize: 13 } }} />
            <ServiceWorkerRegistration />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}