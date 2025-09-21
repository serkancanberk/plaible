import React from 'react';

type StyleGuideLayoutProps = {
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  bgClass?: string;
};

export const StyleGuideLayout: React.FC<StyleGuideLayoutProps> = ({ sidebar, children, bgClass }) => {
  return (
    <div className={`min-h-screen text-text-primary ${bgClass ?? 'bg-secondary'}`}>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden lg:block sticky top-0 h-screen overflow-y-auto border-r border-text-secondary/20 p-4">
          {sidebar ?? (
            <nav className="space-y-4">
              <div className="text-label text-text-tertiary">Sections</div>
              <ul className="space-y-2 text-body">
                <li><a href="#text-styles" className="hover:text-accent">Text Styles</a></li>
                <li><a href="#color-styles" className="hover:text-accent">Color Styles</a></li>
                <li><a href="#other-styles" className="hover:text-accent">Other Styles</a></li>
                <li><a href="#components" className="hover:text-accent">Components</a></li>
              </ul>
            </nav>
          )}
        </aside>

        {/* Main preview */}
        <main className="min-w-0 p-6 md:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};


