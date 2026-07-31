import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'GovInsight Nepal — Public Budget Intelligence Platform',
  description: 'AI-powered analysis of Nepal government documents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 12, fontSize: 13 } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
