import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from 'sonner';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export const metadata = {
  title: 'GovInsight Nepal — Public Budget Intelligence Platform',
  description: 'AI-powered analysis of Nepal government documents',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-512.svg',
  },
};

export const viewport = {
  themeColor: '#13294e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
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
