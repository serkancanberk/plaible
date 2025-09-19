import React, { useEffect, useState } from 'react';

type AppGridLayoutProps = {
  children?: React.ReactNode;
};

export const AppGridLayout: React.FC<AppGridLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  // Prevent background scroll when sidebar is open on small screens
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // ignore network errors; proceed with local cleanup
    } finally {
      try { localStorage.removeItem('user'); } catch {}
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar (mobile/tablet) */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          aria-label="Toggle navigation"
          onClick={toggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        >
          {/* Hamburger icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="font-semibold">Plaible</div>
      </header>

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar overlay for small screens */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white p-4 shadow-md transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-full lg:translate-x-0 lg:shadow-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <div className="text-lg font-semibold">Plaible</div>
          </div>

          {/* Close button (mobile only) */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <div className="text-lg font-semibold">Plaible</div>
            <button
              aria-label="Close navigation"
              onClick={closeSidebar}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <div className="flex h-full flex-col">
            <nav className="space-y-1">
              <a href="#play" className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>Home</span>
              </a>
              <a href="#wallet" className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                <span>Wallet</span>
              </a>
              <a href="#profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                <span>Profile</span>
              </a>
              <a href="#feedback" className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">
                <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
                <span>Feedback</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer text-sm text-gray-400 hover:text-red-400 transition"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="z-10 min-w-0 bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
          {children ?? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">
              <h1 className="mb-2 text-xl font-semibold">App Content</h1>
              <p>
                This is the main content area. Resize the window to test responsive
                behavior and use the hamburger to toggle the sidebar on small screens.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};


