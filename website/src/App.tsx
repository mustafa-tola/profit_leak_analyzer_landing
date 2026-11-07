import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollManager } from './components/ScrollManager';
import { Home } from './pages/Home';

const PrivacyPolicy = lazy(() =>
  import('./pages/PrivacyPolicy').then((module) => ({
    default: module.PrivacyPolicy,
  }))
);
const TermsOfService = lazy(() =>
  import('./pages/TermsOfService').then((module) => ({
    default: module.TermsOfService,
  }))
);
const AppPage = lazy(() =>
  import('./pages/AppPage').then((module) => ({
    default: module.AppPage,
  }))
);


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
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/app" element={<AppPage isDark={isDark} />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<Home isDark={isDark} />} />
            </Routes>
          </Suspense>
          <Footer />
        </div>
      </MotionConfig>
    </BrowserRouter>);

}

function PageFallback() {
  return <main aria-busy="true" aria-label="Loading page" className="min-h-[60vh]" />;
}