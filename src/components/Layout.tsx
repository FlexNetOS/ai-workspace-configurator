import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatPanel from './ChatPanel';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{
        backgroundColor: '#020617',
        color: '#94A3B8',
      }}
    >
      <Navbar />
      <main className="flex-1 flex flex-col pt-[56px] transition-all duration-300">
        <div className="flex-1">{children}</div>
        <Footer />
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0B1120',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F0F4F8',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '13px',
          },
        }}
      />
      <ChatPanel />
    </div>
  );
}
