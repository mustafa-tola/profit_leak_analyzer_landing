import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MenuIcon, XIcon } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { ButtonLink } from './ButtonLink';
import { navLinks } from '../data/navigation';

type NavbarProps = {theme: 'light' | 'dark';onToggleTheme: () => void;};

export function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color] duration-200 ease-out ${
      solid ? 'border-line bg-canvas/85 backdrop-blur-lg' : 'border-transparent bg-canvas/0'}`
      }>
      
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) =>
          <Link
            key={link.href}
            to={`/${link.href}`}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors duration-150 ease-out hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            
              {link.label}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div className="hidden sm:block">
            <ButtonLink href="/#get-started">Get Started</ButtonLink>
          </div>
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden">
            
            {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open &&
        <motion.nav
          id="mobile-menu"
          aria-label="Mobile"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="border-t border-line bg-canvas px-5 pb-5 pt-2 lg:hidden">
          
            <ul className="flex flex-col">
              {navLinks.map((link) =>
            <li key={link.href}>
                  <Link
                to={`/${link.href}`}
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-3 text-[15px] font-medium text-ink hover:bg-subtle">
                
                    {link.label}
                  </Link>
                </li>
            )}
            </ul>
            <div className="mt-3">
              <ButtonLink href="/#get-started" fullWidth onClick={() => setOpen(false)}>
                Get Started
              </ButtonLink>
            </div>
          </motion.nav>
        }
      </AnimatePresence>
    </header>);

}