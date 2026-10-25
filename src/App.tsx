import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollManager } from './components/ScrollManager';
import { Home } from './pages/Home';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

interface AppProps {
  initialTheme?: 'light' | 'dark';
}

export function App({ initialTheme = 'light' }: AppProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ScrollManager />
        <div className="min-h-screen w-full bg-canvas font-sans text-ink antialiased">
          <Navbar theme={theme} onToggleTheme={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')} />
          <Routes>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<Home isDark={isDark} />} />
          </Routes>
          <Footer />
        </div>
      </MotionConfig>
    </BrowserRouter>);

}