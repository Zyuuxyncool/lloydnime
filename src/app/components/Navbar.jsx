"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detect scroll for glass effect
  useEffect(() => {
    setIsMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: "/populer", name: "Populer" },
    { href: "/movie", name: "Movie" },
    { href: "/genres", name: "Genre" },
    { href: "/schedule", name: "Schedule" },
  ];

  if (user) {
    navLinks.push({ href: "/users/dashboard", name: "Dashboard" });
    navLinks.push({ href: "/api/auth/signout", name: "Logout" });
  } else {
    navLinks.push({ href: "/api/auth/signin", name: "Login" });
  }

  return (
    <>
      <nav 
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${isMounted && scrolled 
            ? 'bg-neutral-900/95 backdrop-blur-lg shadow-lg shadow-pink-500/10' 
            : 'bg-transparent'
          }
        `}
        suppressHydrationWarning
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo Text */}
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              LloydNime
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="group relative px-4 py-2 text-neutral-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    <span>{link.name}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* User Info (Desktop) */}
            {user && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-neutral-800/50 rounded-full backdrop-blur-sm border border-neutral-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-neutral-300">{user.name || user.email}</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="md:hidden relative w-10 h-10 rounded-lg bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700/50 transition-colors"
            >
              <svg 
                className="w-6 h-6 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div 
          className={`
            md:hidden absolute top-full left-0 right-0 
            bg-neutral-900/98 backdrop-blur-xl border-b border-neutral-800
            transition-all duration-300 ease-in-out overflow-hidden
            ${isMounted && isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
          `}
          suppressHydrationWarning
        >
          <div className="container mx-auto px-4 py-4">
            {/* User Info (Mobile) */}
            {user && (
              <div className="flex items-center gap-3 p-4 mb-4 bg-neutral-800/50 rounded-xl backdrop-blur-sm border border-neutral-700">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                </div>
              </div>
            )}

            {/* Mobile Links */}
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="flex items-center gap-3 p-3 text-neutral-300 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-pink-500/30"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="font-medium">{link.name}</span>
                    <svg className="w-5 h-5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
      
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}

export default Navbar;