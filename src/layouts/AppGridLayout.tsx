import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PlaibleLogo from '../components/PlaibleLogo';
import { motion, AnimatePresence } from 'framer-motion';
import NavItem from '../components/ui/NavItem';
import MenuItem from '../components/MenuItem';
import StoryCard from '../components/ui/StoryCard';
import { useStories } from '../hooks/useStories';
import { categoryConfig } from '../config/categoryConfig';
import { MobileHeader } from '../components/ui/MobileHeader';
import IconHome from 'virtual:icons/tabler/home';
import IconMessage from 'virtual:icons/tabler/message';
import IconPlus from 'virtual:icons/tabler/plus';
import IconChevronRight from 'virtual:icons/tabler/chevron-right';
import IconChevronLeft from 'virtual:icons/tabler/chevron-left';
import IconUser from 'virtual:icons/tabler/user';
import IconSearch from 'virtual:icons/tabler/search';
import IconBookmark from 'virtual:icons/tabler/bookmark';
import IconClock from 'virtual:icons/tabler/clock';
import IconDots from 'virtual:icons/tabler/dots';
import IconSettings from 'virtual:icons/tabler/settings';
import IconFlag from 'virtual:icons/tabler/flag';
import IconGoogle from 'virtual:icons/simple-icons/google';
import GetTheAppModal from '../components/ui/modals/GetTheAppModal';
import SearchModal from '../components/ui/modals/SearchModal';
import StorySettingsModal from '../components/ui/modals/StorySettingsModal';
import ReportIssueModal from '../components/ui/modals/ReportIssueModal';
import { StorySettingsProvider } from '../components/ui/storySettings/StorySettingsProvider';
import { useAuth } from '../hooks/useAuth';

type AppGridLayoutProps = {
  children?: React.ReactNode;
};

export const AppGridLayout: React.FC<AppGridLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, login, logout } = useAuth();
  
  // Initialize from URL params
  const [selectedMain, setSelectedMain] = useState<'books' | 'stories' | 'biographies'>(
    (searchParams.get('category') as 'books' | 'stories' | 'biographies') || 'books'
  );
  const [selectedSub, setSelectedSub] = useState<string | null>(
    searchParams.get('subcategory')
  );
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isGetAppModalOpen, setIsGetAppModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isStorySettingsModalOpen, setIsStorySettingsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isKebabOpen, setIsKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);
  const desktopDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [canMobileScrollLeft, setCanMobileScrollLeft] = useState(false);
  const [canMobileScrollRight, setCanMobileScrollRight] = useState(false);
  const [canMobileScroll, setCanMobileScroll] = useState(false);
  const [categoriesAgg, setCategoriesAgg] = useState<Array<{ id: string; count: number; subCategories: Array<{ id: string; count: number }> }>>([]);
  const countsByMain = React.useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const cat of categoriesAgg) {
      const subMap: Record<string, number> = {};
      for (const s of cat?.subCategories || []) subMap[s.id] = s.count || 0;
      map[cat.id] = subMap;
    }
    return map;
  }, [categoriesAgg]);

  // Check if we're on a story details page to hide SubNavigation
  const isStoryDetailsPage = location.pathname.includes('/stories/') && location.pathname !== '/app';
  
  // Check if we're on the play onboard page or story runner page to hide SubNavigation
  const hideSubNavigation = location.pathname.includes('/play/onboard') || location.pathname.includes('/play/run');

  // Check if we're on the play onboard page for header title
  const isPlayOnboardPage = location.pathname.includes('/play/onboard');
  
  // Check if we're on the story runner page
  const isStoryRunnerPage = location.pathname.includes('/play/run');

  // Header configuration based on route
  const getHeaderConfig = () => {
    if (isPlayOnboardPage) {
      return {
        title: "The World Is Waiting For You",
        actions: [
          {
            type: "search",
            icon: IconSearch,
            label: "Search",
            onClick: openSearchModal,
          },
          {
            type: "save",
            icon: IconBookmark,
            label: "Save",
            onClick: () => console.log("Save clicked"),
          },
          {
            type: "menu",
            icon: IconDots,
            label: "More",
            onClick: () => setIsKebabOpen(!isKebabOpen),
          },
        ],
      };
    }

    if (isStoryRunnerPage) {
      return {
        title: "In the Scene",
        actions: [
          {
            type: "search",
            icon: IconSearch,
            label: "Search",
            onClick: openSearchModal,
          },
          {
            type: "save",
            icon: IconBookmark,
            label: "Save",
            onClick: () => console.log("Save clicked"),
          },
          {
            type: "menu",
            icon: IconDots,
            label: "More",
            onClick: () => setIsKebabOpen(!isKebabOpen),
          },
        ],
      };
    }

    if (isStoryDetailsPage) {
      return {
        title: "Step Into The Story",
        actions: [
          {
            type: "search",
            icon: IconSearch,
            label: "Search",
            onClick: openSearchModal,
          },
          {
            type: "save",
            icon: IconBookmark,
            label: "Save",
            onClick: () => console.log("Save clicked"),
          },
          {
            type: "menu",
            icon: IconDots,
            label: "More",
            onClick: () => setIsKebabOpen(!isKebabOpen),
          },
        ],
      };
    }

    // Default feed header
    return {
      title: "Choose A Story",
      actions: [
        {
          type: "search",
          icon: IconSearch,
          label: "Search",
          onClick: openSearchModal,
        },
        {
          type: "add",
          icon: IconPlus,
          label: "Add",
          onClick: () => console.log("Add clicked"),
        },
        {
          type: "menu",
          icon: IconDots,
          label: "More",
          onClick: () => setIsKebabOpen(!isKebabOpen),
        },
      ],
    };
  };

  const typeOptions: Array<{ id: 'books' | 'stories' | 'biographies'; label: 'Books' | 'Stories' | 'Biographies' }> = [
    { id: 'books', label: 'Books' },
    { id: 'stories', label: 'Stories' },
    { id: 'biographies', label: 'Biographies' },
  ];

  // Stories list state
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const { data: stories, total, loading, error } = useStories({ page, pageSize, category: selectedMain, subcategory: selectedSub ?? undefined });
  console.log('[Mobile useStories params]', { page, pageSize, category: selectedMain, subcategory: selectedSub ?? undefined });
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));

  // URL sync function
  const updateUrl = (main: string, sub?: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', main);
    if (sub) {
      params.set('subcategory', sub);
    } else {
      params.delete('subcategory');
    }
    setSearchParams(params);
  };

  const openGetAppModal = () => setIsGetAppModalOpen(true);
  const closeGetAppModal = () => setIsGetAppModalOpen(false);

  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);

  const openReportModal = () => setIsReportModalOpen(true);
  const closeReportModal = () => setIsReportModalOpen(false);

  const openShareModal = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this story on Plaible',
          text: 'I found this amazing interactive story!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      console.log('Story link copied to clipboard');
    }
  };

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

  const scrollMobileCategoriesRight = () => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    const amount = el.clientWidth / 2;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const scrollMobileCategoriesLeft = () => {
    const el = mobileCarouselRef.current;
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

  const updateMobileCarouselScrollState = () => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    const scrollable = el.scrollWidth > el.clientWidth;
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    setCanMobileScroll(scrollable);
    setCanMobileScrollLeft(scrollable && !atStart);
    setCanMobileScrollRight(scrollable && !atEnd);
  };

  useEffect(() => {
    updateCarouselScrollState();
    updateMobileCarouselScrollState();
    const onResize = () => {
      updateCarouselScrollState();
      updateMobileCarouselScrollState();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Fetch categories aggregation for dropdown + subcategory carousel
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch('/api/stories/categories', { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
        setCategoriesAgg(list);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Quick verification log to ensure slug-based mapping works as expected
  useEffect(() => {
    const val = countsByMain['books']?.['classic-novels'];
    if (val !== undefined) {
      // Example expected in some environments: 2
      // This confirms lookup by value/id (slug) rather than label
      console.log('[SubNav] count books/classic-novels =', val);
    }
  }, [countsByMain]);

  // Helpers to map counts from aggregation by id
  const getCategoryCount = (mainId: string) => categoriesAgg.find((c) => c.id === mainId)?.count || 0;
  const getSubcategoryCount = (mainId: string, subId: string) => countsByMain[mainId]?.[subId] ?? 0;

  // Subcategories for selected main from config (ensures full set including zeros)
  const selectedConfig = categoryConfig.find((c) => c.value === selectedMain);
  const subCategoriesForSelected = selectedConfig?.subCategories || [];

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

  const onMobileCarouselMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = el.scrollLeft;
  };

  const onMobileCarouselMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    if (!isDraggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    el.scrollLeft = dragStartScrollLeftRef.current - delta;
    updateMobileCarouselScrollState();
  };

  const endMobileCarouselDrag = () => {
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
      const target = event.target as Node;
      const inMobile = mobileDropdownRef.current?.contains(target) ?? false;
      const inDesktop = desktopDropdownRef.current?.contains(target) ?? false;
      if (!inMobile && !inDesktop) {
        setIsTypeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug: Log selectedMain state changes
  useEffect(() => {
    console.log('[useEffect:selectedMain changed]', selectedMain);
  }, [selectedMain]);

  // Handle kebab dropdown click outside and escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(event.target as Node)) {
        setIsKebabOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsKebabOpen(false);
      }
    };

    if (isKebabOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isKebabOpen]);

  return (
    <StorySettingsProvider>
      <div className="flex h-screen w-full bg-secondary">
      {(() => {
        console.log('[Render] selectedMain =', selectedMain);
        console.log('[ROLLBACK] Layout and scroll behavior restored to previous stable version');
        return null;
      })()}
      {/* Mobile branch */}
      <div className="block lg:hidden">
        {/* Mobile top nav */}
        <MobileHeader
          items={[
            { label: 'Play' },
            { label: 'Message' },
            { label: 'Search' },
            { label: 'Add' },
            { 
              label: 'Your Stories',
              children: [
                { label: 'Recent' },
                { label: 'Saved' },
              ]
            },
            { label: 'Your Profile' },
          ]}
          logoVariant="light"
          bgClassName="bg-primary"
          onOpenSearch={openSearchModal}
          onOpenDownload={openGetAppModal}
        />

        {/* Mobile content only - no sidebar */}
        <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl flex flex-col">
          {/* Section heading */}
          <div className="px-spacing-md pt-spacing-2xl pb-spacing-sm">
            <div className="text-heading font-serif text-accent">{getHeaderConfig().title}</div>
          </div>

          {/* SubNavigation - only show on main feed page */}
          {!isStoryDetailsPage && !hideSubNavigation && (
            <section className="px-spacing-md py-spacing-sm mt-spacing-lg">
            <div className="flex items-center justify-between gap-spacing-md">
              {/* Left: Dropdown + Scrollable categories */}
              <div className="flex items-center gap-spacing-lg flex-1 min-w-0">
                {/* Dropdown */}
                <div ref={mobileDropdownRef} className="relative shrink-0 overflow-visible z-20">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isTypeMenuOpen}
                    onClick={() => setIsTypeMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-spacing-xs rounded-md border border-text-secondary/30 bg-secondary text-mono text-label text-accent px-spacing-md py-spacing-xs hover:bg-accent/10"
                  >
                    <span className="text-mono text-label">{typeOptions.find(t => t.id === selectedMain)?.label || 'Book'}</span>
                    <span className="inline-flex items-center justify-center text-accent">
                      <IconChevronRight className="w-4 h-4 rotate-90" />
                    </span>
                  </button>
                  {isTypeMenuOpen ? (
                    <>
                      {(() => {
                        console.log('[Mobile Dropdown Container Rendered]');
                        return null;
                      })()}
                      <div
                        className="absolute left-0 z-20 mt-spacing-xs w-max min-w-full rounded-md border border-text-secondary/30 bg-secondary"
                        style={{ zIndex: 9999 }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {(() => {
                          console.log('[Mobile Dropdown -> Applied high z-index]');
                          return null;
                        })()}
                        <div className="py-spacing-xs">
                        {typeOptions.map((opt) => {
                          console.log('[Mobile Dropdown -> opt]', opt);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="option"
                              aria-selected={selectedMain === opt.id}
                              onClick={() => {
                                console.log('[Mobile Dropdown -> Button Clicked]', { optId: opt.id, label: opt.label });
                                console.log('[Mobile Dropdown -> onClick]', { optId: opt.id });
                                console.log('[Mobile Dropdown]', { selectedMain: opt.id, selectedSub: null });
                                console.log('[Mobile Dropdown -> State Reset]', { selectedMain: opt.id, resetSub: true, resetPage: 1 });
                                setSelectedMain(opt.id);
                                setSelectedSub(null);
                                setPage(1);
                                updateUrl(opt.id, null);
                                setIsTypeMenuOpen(false);
                              }}
                              className="block w-full text-left px-spacing-md py-spacing-xs text-mono text-label text-accent hover:bg-accent/10"
                            >
                              <span className="text-mono text-label">{opt.label}</span>
                            </button>
                          );
                        })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Left arrow (scroll left) */}
                {canMobileScroll ? (
                  <button
                    type="button"
                    onClick={scrollMobileCategoriesLeft}
                    aria-label="Scroll categories left"
                    disabled={!canMobileScrollLeft}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-text-secondary/30 bg-secondary text-text-secondary hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                  </button>
                ) : null}

                {/* Scrollable Category Carousel */}
                <div
                  ref={mobileCarouselRef}
                  onScroll={updateMobileCarouselScrollState}
                  onMouseDown={onMobileCarouselMouseDown}
                  onMouseMove={onMobileCarouselMouseMove}
                  onMouseUp={endMobileCarouselDrag}
                  onMouseLeave={endMobileCarouselDrag}
                  className={[
                    'inline-flex', 'whitespace-nowrap', 'items-center', 'gap-spacing-lg', 'overflow-x-auto',
                    'snap-x', 'snap-mandatory', 'scroll-smooth', '[scrollbar-width:none]', '[&::-webkit-scrollbar]:hidden',
                    isDragging ? 'cursor-grabbing' : 'cursor-grab',
                  ].join(' ')}
                >
                  {subCategoriesForSelected.map((sub) => {
                    const count = getSubcategoryCount(selectedMain, sub.value);
                    const isActiveSub = count > 0;
                    const isSelected = selectedSub === sub.value;
                    const label = sub.label?.en || sub.value;
                    if (!isActiveSub) {
                      return (
                        <NavItem
                          key={sub.value}
                          className="shrink-0 snap-start whitespace-nowrap"
                          variant="text-muted"
                          label={label}
                        />
                      );
                    }
                    return (
                      <NavItem
                        key={sub.value}
                        className="shrink-0 snap-start whitespace-nowrap"
                        variant="text"
                        active={isSelected}
                        label={label}
                        onClick={() => {
                          console.log('[Mobile Dropdown]', { selectedMain, selectedSub: sub.value });
                          console.log('[Mobile Subcategory Click]', { selectedMain, selectedSub: sub.value });
                          setSelectedSub(sub.value);
                          setPage(1);
                          updateUrl(selectedMain, sub.value);
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Right arrow indicator */}
              {canMobileScroll ? (
                <button
                  type="button"
                  onClick={scrollMobileCategoriesRight}
                  aria-label="Scroll categories right"
                  disabled={!canMobileScrollRight}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-text-secondary/30 bg-secondary text-text-secondary hover:bg-primary/10 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                  <IconChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </section>
          )}

          {/* Content area - replaced with Outlet for routing */}
          <Outlet />
        </div>
      </div>

      {/* Desktop branch */}
      <div className="hidden lg:flex h-screen w-full">
        {/* Overlay & sliding sidebar for tablet/mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={closeSidebar} />
        )}

        {/* App shell: sidebar + content area */}
        <div className="relative flex h-full w-full">
        {/* Sidebar */}
        <aside
          className={[
            'fixed left-0 top-0 h-screen bg-accent transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:block overflow-y-auto border-r border-ui-muted',
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
                    onClick={() => navigate('/app')}
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
                  {user ? (
                    <NavItem
                      variant="icon"
                      icon={
                        user.profilePictureUrl ? (
                          <>
                            {console.log("[PROFILE_IMG_RENDER]", "Collapsed Sidebar")}
                            <img
                              src={user.profilePictureUrl}
                              alt={user.email || 'User'}
                              className="w-9 h-9 rounded-full object-cover hover:opacity-80 transition-opacity"
                              onError={(e) => {
                                // Replace the image with the default icon
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <span class="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                      </svg>
                                    </span>
                                  `;
                                }
                              }}
                            />
                          </>
                        ) : (
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                            <IconUser className="w-4 h-4" />
                          </span>
                        )
                      }
                    />
                  ) : (
                    <NavItem
                      variant="icon"
                      icon={
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                          <IconGoogle className="w-4 h-4" />
                        </span>
                      }
                      onClick={() => login(window.location.pathname)}
                      title="Sign in to start your story"
                    />
                  )}
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
                    onClick={() => navigate('/app')}
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
                  {/* Debug sidebar state */}
                  <span className="sr-only">
                    {(() => {
                      console.log("[SIDEBAR_STATE]", user ? "Authenticated user → showing Recent/Saved" : "Visitor → hiding Recent/Saved");
                      return '';
                    })()}
                  </span>

                  {user ? (
                    <>
                      <span className="sr-only">
                        {(() => {
                          if (!(user.sessions?.length) && !(user.savedStories?.length)) {
                            console.log("[SIDEBAR_STATE] Auth user with empty recent/saved lists.");
                          }
                          return '';
                        })()}
                      </span>
                      {/* Recent section */}
                      <div className="mt-spacing-lg">
                        <NavItem
                          variant="icon+text-outline"
                          label="Recent"
                          icon={
                            <span className="w-8 h-8 flex items-center justify-center rounded-full border border-primary text-primary">
                              <IconClock className="w-4 h-4" />
                            </span>
                          }
                        />
                        <div className="mt-spacing-sm space-y-spacing-xs">
                          {user.sessions?.length ? (
                            user.sessions.map((s: any) => (
                              <NavItem
                                key={s._id}
                                variant="text"
                                label={`${s.story?.title || ''}, Chapter ${s.progress?.chapter ?? 1}`}
                                onClick={() => navigate(`/app/play/run/${s.story?.slug || ''}`)}
                              />
                            ))
                          ) : (
                            <span className="font-mono text-caption text-ui-muted mt-spacing-xs">There is no story yet here.</span>
                          )}
                        </div>
                      </div>

                      {/* Saved section */}
                      <div className="mt-spacing-lg">
                        <NavItem
                          variant="icon+text-outline"
                          label="Saved"
                          icon={
                            <span className="w-8 h-8 flex items-center justify-center rounded-full border border-primary text-primary">
                              <IconBookmark className="w-4 h-4" />
                            </span>
                          }
                        />
                        <div className="mt-spacing-sm space-y-spacing-xs">
                          {user.savedStories?.length ? (
                            user.savedStories.map((s: any) => (
                              <NavItem
                                key={s.slug}
                                variant="text"
                                label={s.title}
                                onClick={() => navigate(`/app/story/${s.slug}`)}
                              />
                            ))
                          ) : (
                            <span className="font-mono text-caption text-ui-muted mt-spacing-xs">There is no story yet here.</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {/* User profile */}
                  {user ? (
                    <div className="mt-spacing-xl relative">
                      <div
                        ref={menuRef}
                        className="relative flex items-center gap-spacing-sm cursor-pointer select-none"
                        onClick={() => setIsMenuOpen(prev => !prev)}
                      >
                        {user.profilePictureUrl ? (
                          <img
                            src={user.profilePictureUrl}
                            alt={user.email || 'User'}
                            className="w-9 h-9 rounded-full object-cover hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                            <IconUser className="w-4 h-4" />
                          </span>
                        )}
                        <span className="text-body text-text-primary truncate">
                          {user.identity?.displayName || user.email || 'User'}
                        </span>
                        <AnimatePresence>
                          {isMenuOpen && (
                            <motion.div
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 20, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              className="absolute bottom-spacing-2xl left-0 right-0 bg-secondary rounded-card shadow-lg p-spacing-md flex flex-col space-y-spacing-sm"
                            >
                              <button
                                className="text-body text-text-primary hover:text-accent transition-colors text-left"
                                onClick={() => navigate('/app/profile')}
                              >
                                Edit Your Profile
                              </button>
                              <button
                                className="text-body text-text-primary hover:text-accent transition-colors text-left"
                                onClick={logout}
                              >
                                Logout
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <NavItem
                      variant="icon+text"
                      label="Continue with Google"
                      className="mt-spacing-xl"
                      icon={
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                          <IconGoogle className="w-4 h-4" />
                        </span>
                      }
                      onClick={() => login(window.location.pathname)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Content column */}
        <div className="flex-1 h-full flex flex-col">
          {/* Header */}
          
          {/* Sticky header remains as-is below */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-text-secondary/30 bg-secondary">
              <div className="flex items-center justify-between px-spacing-md pt-spacing-2xl pb-spacing-sm">
                {/* Title */}
                <div className="text-heading font-serif text-accent">
                  {getHeaderConfig().title}
                </div>

                {/* Action Buttons */}
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
                  
                  {/* Dynamic Actions */}
                  <div className="hidden lg:flex items-center gap-spacing-xl">
                    {getHeaderConfig().actions.map((action) => (
                      <NavItem
                        key={action.type}
                        variant="icon+text-secondary"
                        label={action.label}
                        icon={
                          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:opacity-80">
                            <action.icon className="w-4 h-4" />
                          </span>
                        }
                        onClick={action.onClick}
                      />
                    ))}
                    
                    {/* Kebab Menu (only for menu action) */}
                    {getHeaderConfig().actions.find(action => action.type === 'menu') && (
                      <div ref={kebabRef} className="relative">
                        {isKebabOpen && (
                          <div className="absolute right-0 mt-spacing-xs z-50 bg-primary rounded-card shadow-card w-48 py-spacing-lg px-spacing-sm">
                            <div className="flex flex-col space-y-spacing-lg">
                              <NavItem
                                variant="text-secondary"
                                label="Download"
                                className="w-full px-spacing-lg"
                                onClick={() => {
                                  console.log('[kebab] Download');
                                  openGetAppModal();
                                  setIsKebabOpen(false);
                                }}
                              />
                              <NavItem
                                variant="text-secondary"
                                label="Story Settings"
                                className="w-full px-spacing-lg"
                                onClick={() => {
                                  console.log('[kebab] Story Settings');
                                  setIsStorySettingsModalOpen(true);
                                  setIsKebabOpen(false);
                                }}
                              />
                              <NavItem
                                variant="text-secondary"
                                label="Share"
                                className="w-full px-spacing-lg"
                                onClick={() => {
                                  console.log('[kebab] Share');
                                  openShareModal();
                                  setIsKebabOpen(false);
                                }}
                              />
                              <NavItem
                                variant="text-secondary"
                                label="Report"
                                className="w-full px-spacing-lg"
                                onClick={() => {
                                  console.log('[kebab] Report');
                                  openReportModal();
                                  setIsKebabOpen(false);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Divider after header */}

            {/* SubNavigation - only show on main feed page */}
            {!isStoryDetailsPage && !hideSubNavigation && (
              <section className="px-spacing-md py-spacing-sm mt-spacing-lg">
              <div className="flex items-center justify-between gap-spacing-md">
                {/* Left: Dropdown + Scrollable categories */}
                <div className="flex items-center gap-spacing-lg flex-1 min-w-0">
                  {/* Dropdown */}
                  <div ref={desktopDropdownRef} className="relative shrink-0 overflow-visible z-20">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={isTypeMenuOpen}
                      onClick={() => setIsTypeMenuOpen((v) => !v)}
                      className="inline-flex items-center gap-spacing-xs rounded-md border border-text-secondary/30 bg-secondary text-mono text-label text-accent px-spacing-md py-spacing-xs hover:bg-accent/10"
                    >
                      <span className="text-mono text-label">{typeOptions.find(t => t.id === selectedMain)?.label || 'Book'}</span>
                      <span className="inline-flex items-center justify-center text-accent">
                        <IconChevronRight className="w-4 h-4 rotate-90" />
                      </span>
                    </button>
                    {isTypeMenuOpen ? (
                      <div className="absolute left-0 z-20 mt-spacing-xs w-max min-w-full rounded-md border border-text-secondary/30 bg-secondary">
                        <div className="py-spacing-xs">
                          {typeOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              role="option"
                              aria-selected={selectedMain === opt.id}
                              onClick={() => {
                                setSelectedMain(opt.id);
                                setSelectedSub(null);
                                setPage(1);
                                updateUrl(opt.id, null);
                                setIsTypeMenuOpen(false);
                              }}
                              className="block w-full text-left px-spacing-md py-spacing-xs text-mono text-label text-accent hover:bg-accent/10"
                            >
                              <span className="text-mono text-label">{opt.label}</span>
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
                    {subCategoriesForSelected.map((sub) => {
                      const count = getSubcategoryCount(selectedMain, sub.value);
                      // DIAGNOSTIC: Verify subcategory rendering logic and counts
                      console.log('[SubNav] count check', selectedMain, sub.value, count);
                      const isActiveSub = count > 0;
                      const isSelected = selectedSub === sub.value;
                      const label = sub.label?.en || sub.value;
                      if (!isActiveSub) {
                        return (
                          <NavItem
                            key={sub.value}
                            className="shrink-0 snap-start whitespace-nowrap"
                            variant="text-muted"
                            label={label}
                          />
                        );
                      }
                      return (
                        <NavItem
                          key={sub.value}
                          className="shrink-0 snap-start whitespace-nowrap"
                          variant="text"
                          active={isSelected}
                          label={label}
                          onClick={() => {
                            setSelectedSub(sub.value);
                            setPage(1);
                            updateUrl(selectedMain, sub.value);
                          }}
                        />
                      );
                    })}
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
            )}


            {/* Content area - unified scroll with conditional centering */}
            {isStoryRunnerPage ? (
              // Do NOT center StoryRunner; allow its internal chat region to manage scroll
              <Outlet />
            ) : isPlayOnboardPage ? (
              // Center onboarding pages using grid for true visual centering
              <div className="flex-1 min-h-0 grid place-items-center px-spacing-md py-spacing-lg">
                <div className="w-full max-w-none">
                  <Outlet />
                </div>
              </div>
            ) : (
              // Default: top-aligned natural scroll
              <Outlet />
            )}
          </div>
        </div>
      </div>
      </div>
      </div>
      </div>
      <GetTheAppModal open={isGetAppModalOpen} onClose={closeGetAppModal} />
      <SearchModal open={isSearchModalOpen} onClose={closeSearchModal} />
      <StorySettingsModal open={isStorySettingsModalOpen} onClose={() => setIsStorySettingsModalOpen(false)} />
      <ReportIssueModal open={isReportModalOpen} onClose={closeReportModal} />
    </StorySettingsProvider>
  );
};
