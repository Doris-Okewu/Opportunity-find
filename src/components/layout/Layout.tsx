import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { normalizePath, trackSiteEvent } from '../../features/tracking/trackSiteEvent';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const { pathname } = useLocation();

  // Anonymous page-view analytics: route pattern only (ids stripped).
  useEffect(() => {
    trackSiteEvent('page_view', { detail: normalizePath(pathname) });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
