import React, { useEffect, useState } from 'react';
import PlaibleLogo from '../components/PlaibleLogo';
import NavItem from '../components/ui/NavItem';
import IconHome from 'virtual:icons/tabler/home';
import IconMessage from 'virtual:icons/tabler/message';
import IconPlus from 'virtual:icons/tabler/plus';
import IconChevronRight from 'virtual:icons/tabler/chevron-right';
import IconChevronLeft from 'virtual:icons/tabler/chevron-left';
import IconUser from 'virtual:icons/tabler/user';

type AppGridLayoutProps = {
  children?: React.ReactNode;
};

export const AppGridLayout: React.FC<AppGridLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  return (
    <div className="h-screen w-full bg-secondary overflow-hidden">
      {/* Overlay & sliding sidebar for tablet/mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={closeSidebar} />
      )}

      {/* App shell: sidebar + content area */}
      <div className="relative flex h-full w-full">
        {/* Sidebar */}
        <aside
          className={[
            'fixed left-0 top-0 h-full bg-accent transition-transform duration-200 ease-out transition-all lg:static lg:translate-x-0 lg:block',
            sidebarCollapsed ? 'w-20' : 'w-64',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <div className="h-full flex flex-col text-primary font-mono px-spacing-md py-spacing-md">
            {sidebarCollapsed ? (
              // Collapsed state (renders when sidebarCollapsed is true)
              <div className="flex h-full w-full flex-col items-center">
                {/* Top group: logo, home, expand */}
                <div className="flex flex-col items-center gap-spacing-lg pt-spacing-md">
                  <PlaibleLogo variant="emoji-logo" size="xl" />
                  <NavItem
                    variant="icon"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconHome className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                  <NavItem
                    variant="icon"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconChevronRight className="w-4 h-4 text-accent" />
                      </span>
                    }
                    onClick={() => setSidebarCollapsed(false)}
                  />
                </div>

                {/* Bottom: user avatar only */}
                <div className="mt-auto pb-spacing-md w-full flex items-center justify-center">
                  <NavItem
                    variant="icon"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconUser className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                </div>
              </div>
            ) : (
              // Expanded state (default and mobile overlay)
              <div className="flex h-full w-full flex-col">
                {/* Top row: Logo + collapse toggle (desktop only) */}
                <div className="hidden lg:flex items-center justify-between">
                  <div className="flex items-center">
                    <PlaibleLogo size="sm" />
                  </div>
                  <NavItem
                    variant="icon"
                    onClick={() => setSidebarCollapsed(true)}
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconChevronLeft className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                </div>

                {/* Menu section */}
                <div className="mt-spacing-lg space-y-spacing-sm">
                  <NavItem
                    variant="icon+text"
                    label="Play"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconHome className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                  <NavItem
                    variant="icon+text"
                    label="Message (Soon)"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconMessage className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                  <NavItem
                    variant="icon+text"
                    label="Add"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconPlus className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                </div>

                {/* Bottom zone: Recent, Saved, User */}
                <div className="flex-1 flex flex-col justify-end">
                  {/* Recent section */}
                  <div className="mt-spacing-lg">
                    <div className="text-body font-semibold text-text-primary">Recent</div>
                    <div className="mt-spacing-sm space-y-spacing-xs">
                      <NavItem variant="text" label="“BookName”, Character…" />
                      <NavItem variant="text" label="“BookName”, Character…" />
                      <NavItem variant="text" label="“BookName”, Character…" />
                    </div>
                  </div>

                  {/* Saved section */}
                  <div className="mt-spacing-lg">
                    <div className="text-body font-semibold text-text-primary">Saved</div>
                    <div className="mt-spacing-sm space-y-spacing-xs">
                      <NavItem variant="text" label="“BookName”, Character…" />
                      <NavItem variant="text" label="“BookName”, Character…" />
                      <NavItem variant="text" label="“BookName”, Character…" />
                    </div>
                  </div>

                  {/* User profile */}
                  <NavItem
                    variant="icon+text"
                    label="FirstName LastName"
                    className="mt-spacing-xl"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:opacity-80">
                        <IconUser className="w-4 h-4 text-accent" />
                      </span>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content column */}
        <div className="flex-1 h-full flex flex-col lg:ml-64">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-text-secondary/30 bg-secondary">
            <div className="flex items-center justify-between px-spacing-md py-spacing-sm">
              <div className="text-subheading font-sans text-text-primary">Choose A Story</div>
              <div className="flex items-center gap-spacing-sm">
                {/* Sidebar toggle (only visible on <lg) */}
                <button
                  aria-label="Toggle sidebar"
                  onClick={toggleSidebar}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-text-primary hover:bg-primary/10 lg:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                {/* Actions */}
                <div className="hidden lg:flex items-center gap-spacing-sm">
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-primary/10">
                    <div className="w-5 h-5 bg-text-tertiary" />
                  </button>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-primary/10">
                    <div className="w-5 h-5 bg-text-tertiary" />
                  </button>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-primary/10">
                    <div className="w-5 h-5 bg-text-tertiary" />
                  </button>
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-primary/10">
                    <div className="w-5 h-5 bg-text-tertiary" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 bg-secondary overflow-hidden">
            {children ?? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-text-secondary font-sans">Content area</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};


