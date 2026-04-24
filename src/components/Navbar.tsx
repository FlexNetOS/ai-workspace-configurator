import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DownloadButton } from './DownloadAppButton';

const navLinks = [
  { to: '/', label: 'Wizard' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/settings', label: 'Settings' },
  { to: '/logs', label: 'Logs' },
  { to: '/help', label: 'Help' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-6"
      style={{
        height: '56px',
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo + App Name */}
      <div className="flex items-center gap-3 min-w-[240px]">
        {/* Geometric "A" Logo SVG */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M14 2L3 25H8L10.5 19H17.5L20 25H25L14 2ZM12 15L14 9L16 15H12Z"
            fill="#2563EB"
          />
          <circle cx="14" cy="4" r="2" fill="#06B6D4" />
          <circle cx="5" cy="23" r="1.5" fill="#3B82F6" />
          <circle cx="23" cy="23" r="1.5" fill="#67E8F9" />
          <line
            x1="14"
            y1="6"
            x2="14"
            y2="9"
            stroke="#2563EB"
            strokeWidth="0.5"
            opacity="0.5"
          />
          <line
            x1="6.5"
            y1="22"
            x2="10.5"
            y2="19"
            stroke="#3B82F6"
            strokeWidth="0.5"
            opacity="0.5"
          />
          <line
            x1="21.5"
            y1="22"
            x2="17.5"
            y2="19"
            stroke="#67E8F9"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </svg>
        <span
          className="font-sans"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#F0F4F8',
            letterSpacing: '-0.01em',
          }}
        >
          AI Workspace Configurator
        </span>
      </div>

      {/* Center Navigation Links */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 rounded-lg transition-colors duration-200 focus-ring"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? '#2563EB' : '#94A3B8',
                backgroundColor: isActive
                  ? 'rgba(37, 99, 235, 0.08)'
                  : 'transparent',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#F0F4F8';
                  e.currentTarget.style.backgroundColor =
                    'rgba(255, 255, 255, 0.04)';
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#94A3B8';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Download + Version */}
      <div className="flex items-center justify-end gap-3 min-w-[240px]">
        <DownloadButton />
        <span
          className="font-mono"
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#475569',
            textTransform: 'uppercase',
          }}
        >
          v{__APP_VERSION__}
        </span>
      </div>
    </header>
  );
}
