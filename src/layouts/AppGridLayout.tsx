import React, { useEffect, useRef, useState } from 'react';
import PlaibleLogo from '../components/PlaibleLogo';
import NavItem from '../components/ui/NavItem';
import StoryCard from '../components/ui/StoryCard';
import { useStories } from '../hooks/useStories';
import IconHome from 'virtual:icons/tabler/home';
import IconMessage from 'virtual:icons/tabler/message';
import IconPlus from 'virtual:icons/tabler/plus';
import IconChevronRight from 'virtual:icons/tabler/chevron-right';
import IconChevronLeft from 'virtual:icons/tabler/chevron-left';
import IconUser from 'virtual:icons/tabler/user';
import IconSearch from 'virtual:icons/tabler/search';
import IconDownload from 'virtual:icons/tabler/download';
import IconDots from 'virtual:icons/tabler/dots';

type AppGridLayoutProps = {
  children?: React.ReactNode;
};

export const AppGridLayout: React.FC<AppGridLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedType, setSelectedType] = useState<'Books' | 'Story' | 'Biography'>('Books');
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const typeOptions: Array<'Books' | 'Story' | 'Biography'> = ['Books', 'Story', 'Biography'];

  // Stories list state
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const { data: stories, total, loading, error } = useStories({ page, pageSize });
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));

  const scrollCategoriesRight = () => {
    const el = carouselRef.current;
    if (!el) return;
    const amount = el.clientWidth / 2;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const scrollCategoriesLeft = () => {
    const el = carouselRef.current;
    if (!el) return;
    const amount = el.clientWidth / 2;
    el.scrollBy({ left: -amount, behavior: 'smooth' });
  };

  const updateCarouselScrollState = () => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollable = el.scrollWidth > el.clientWidth;
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    setCanScroll(scrollable);
    setCanScrollLeft(scrollable && !atStart);
    setCanScrollRight(scrollable && !atEnd);
  };

  useEffect(() => {
    updateCarouselScrollState();
    const onResize = () => updateCarouselScrollState();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const onCarouselMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = carouselRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = el.scrollLeft;
  };

  const onCarouselMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = carouselRef.current;
    if (!el) return;
    if (!isDraggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    el.scrollLeft = dragStartScrollLeftRef.current - delta;
    updateCarouselScrollState();
  };

  const endCarouselDrag = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

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

  // Close type dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const el = dropdownRef.current;
      if (el && !el.contains(event.target as Node)) {
        setIsTypeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            'fixed left-0 top-0 h-full bg-accent transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:block',
            sidebarCollapsed ? 'w-20 lg:w-20' : 'w-64 lg:w-64',
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
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconHome className="w-4 h-4" />
                      </span>
                    }
                  />
                  <NavItem
                    variant="icon"
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconChevronRight className="w-4 h-4" />
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
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconUser className="w-4 h-4" />
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
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconChevronLeft className="w-4 h-4" />
                      </span>
                    }
                  />
                </div>

                {/* Menu section */}
                <div className="mt-spacing-lg space-y-spacing-sm">
                  <NavItem
                    variant="icon+text"
                    label="Play"
                    collapsed={sidebarCollapsed}
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconHome className="w-4 h-4" />
                      </span>
                    }
                  />
                  <NavItem
                    variant="icon+text"
                    label="Message (Soon)"
                    collapsed={sidebarCollapsed}
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconMessage className="w-4 h-4" />
                      </span>
                    }
                  />
                  <NavItem
                    variant="icon+text"
                    label="Add"
                    collapsed={sidebarCollapsed}
                    icon={
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconPlus className="w-4 h-4" />
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
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                        <IconUser className="w-4 h-4" />
                      </span>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content column */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-text-secondary/30 bg-secondary">
            <div className="flex items-center justify-between px-spacing-md pt-spacing-2xl pb-spacing-sm">
                <div className="text-heading font-serif text-accent">Choose A Story</div>
                <div className="flex items-center gap-spacing-md">
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
                  <div className="hidden lg:flex items-center gap-spacing-xl">
                    <NavItem
                      variant="icon+text-secondary"
                      label="Search"
                      icon={
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                          <IconSearch className="w-4 h-4" />
                        </span>
                      }
                    />
                    <NavItem
                      variant="icon+text-secondary"
                      label="Download"
                      icon={
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                          <IconDownload className="w-4 h-4" />
                        </span>
                      }
                    />
                    <NavItem
                      variant="icon+text-secondary"
                      label="Add"
                      icon={
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                          <IconPlus className="w-4 h-4" />
                        </span>
                      }
                    />
                    <NavItem
                      variant="icon+text-secondary"
                      icon={
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                          <IconDots className="w-4 h-4" />
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Divider after header */}

            {/* SubNavigation */}
            <section className="px-spacing-md py-spacing-sm mt-spacing-lg">
              <div className="flex items-center justify-between gap-spacing-md">
                {/* Left: Dropdown + Scrollable categories */}
                <div className="flex items-center gap-spacing-lg flex-1 min-w-0">
                  {/* Dropdown */}
                  <div ref={dropdownRef} className="relative shrink-0 overflow-visible z-20">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isTypeMenuOpen}
                      onClick={() => setIsTypeMenuOpen((v) => !v)}
                      className="inline-flex items-center gap-spacing-xs rounded-md border border-text-secondary/30 bg-secondary text-mono text-label text-accent px-spacing-md py-spacing-xs hover:bg-accent/10"
                    >
                      <span className="text-mono text-label">{selectedType}</span>
                      <span className="inline-flex items-center justify-center text-accent">
                        <IconChevronRight className="w-4 h-4 rotate-90" />
                      </span>
                    </button>
                    {isTypeMenuOpen ? (
                      <div className="absolute left-0 z-20 mt-spacing-xs w-max min-w-full rounded-md border border-text-secondary/30 bg-secondary">
                        <div className="py-spacing-xs">
                          {typeOptions.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              role="option"
                              aria-selected={selectedType === opt}
                              onClick={() => {
                                setSelectedType(opt);
                                setIsTypeMenuOpen(false);
                              }}
                              className="block w-full text-left px-spacing-md py-spacing-xs text-mono text-label text-accent hover:bg-accent/10"
                            >
                              <span className="text-mono text-label">{opt}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Left arrow (scroll left) */}
                  {canScroll ? (
                    <button
                      type="button"
                      onClick={scrollCategoriesLeft}
                      aria-label="Scroll categories left"
                      disabled={!canScrollLeft}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-text-secondary/30 bg-secondary text-text-secondary hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                    >
                      <IconChevronLeft className="w-4 h-4" />
                    </button>
                  ) : null}

                  {/* Scrollable Category Carousel */}
                  <div
                    ref={carouselRef}
                    onScroll={updateCarouselScrollState}
                    onMouseDown={onCarouselMouseDown}
                    onMouseMove={onCarouselMouseMove}
                    onMouseUp={endCarouselDrag}
                    onMouseLeave={endCarouselDrag}
                    className={[
                      'inline-flex', 'whitespace-nowrap', 'items-center', 'gap-spacing-lg', 'overflow-x-auto',
                      'snap-x', 'snap-mandatory', 'scroll-smooth', '[scrollbar-width:none]', '[&::-webkit-scrollbar]:hidden',
                      isDragging ? 'cursor-grabbing' : 'cursor-grab',
                    ].join(' ')}
                  >
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-secondary" label="All" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-secondary" label="Sub Category 1" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-secondary" label="Sub Category 2" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-secondary" label="Sub Category 3" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-secondary" label="Sub Category 4" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-muted" label="Sub Category 5" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-muted" label="Sub Category 6" />
                    <NavItem className="shrink-0 snap-start whitespace-nowrap" variant="text-muted" label="Sub Category 7" />
                  </div>
                </div>

                {/* Right arrow indicator */}
                {canScroll ? (
                  <button
                    type="button"
                    onClick={scrollCategoriesRight}
                    aria-label="Scroll categories right"
                    disabled={!canScrollRight}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-text-secondary/30 bg-secondary text-text-secondary hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </section>


            {/* Story grid */}
            <section className="px-spacing-md py-spacing-lg">
              <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xl justify-items-center">
                  {loading
                    ? Array.from({ length: pageSize }).map((_, i) => (
                        <div key={i} className="w-full max-w-[300px] rounded-card bg-primary shadow-card overflow-hidden animate-pulse">
                          <div className="px-spacing-md pt-spacing-md">
                            <div className="aspect-[16/9] w-full rounded-md bg-ui-muted" />
                          </div>
                          <div className="px-spacing-md pt-spacing-md pb-spacing-md space-y-spacing-sm">
                            <div className="h-6 w-3/4 bg-ui-muted rounded" />
                            <div className="h-4 w-1/2 bg-ui-muted rounded" />
                            <div className="h-4 w-full bg-ui-muted rounded" />
                            <div className="h-10 w-full bg-ui-muted rounded-card" />
                          </div>
                        </div>
                      ))
                    : stories && stories.length > 0
                      ? (
                        <>
                          {stories.map((s) => (
                            <StoryCard
                              key={s.slug}
                              title={s.title}
                              authorName={s.authorName}
                              slug={s.slug}
                              headline={s.headline}
                              assets={s.assets}
                              stats={s.stats}
                            />
                          ))}
                          {/* Temporary duplicate for visual testing */}
                          <StoryCard
                            key="mock-duplicate"
                            title="Frankenstein"
                            authorName="Mary Shelley"
                            slug="frankenstein"
                            headline="A gothic story about ambition and its consequences."
                            assets={{ images: ['/placeholder.png'] }}
                            stats={{ totalPlayed: 1234, avgRating: 4.6 }}
                          />
                        </>
                      )
                      : (
                        <div className="col-span-full text-center font-mono text-text-secondary">No stories found.</div>
                      )}
                </div>
                {error ? (
                  <div className="mt-spacing-md col-span-full text-center text-alert font-mono">Failed to load stories.</div>
                ) : null}
              </div>
            </section>
            {/* Pagination + Info */}
            <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-lg mb-spacing-2xl">
              <div className="flex items-center justify-center gap-spacing-md">
                <NavItem
                  variant="icon+text-secondary"
                  label="Previous"
                  icon={<IconChevronLeft className="w-4 h-4" />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                />
                {Array.from({ length: Math.min(pageCount, 5) }).map((_, idx) => {
                  const num = idx + 1;
                  return (
                    <NavItem
                      key={num}
                      variant="text-secondary"
                      label={String(num)}
                      onClick={() => setPage(num)}
                    />
                  );
                })}
                <NavItem
                  variant="text+icon-secondary"
                  label="Next"
                  icon={<IconChevronRight className="w-4 h-4" />}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                />
              </div>
              <div className="font-mono text-text-secondary text-center mt-spacing-lg">
                Page {page} of {pageCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
