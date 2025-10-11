import React, { useState } from 'react';
import StoryCard from '../components/ui/StoryCard';
import { useStories } from '../hooks/useStories';
import NavItem from '../components/ui/NavItem';
import IconChevronRight from 'virtual:icons/tabler/chevron-right';
import IconChevronLeft from 'virtual:icons/tabler/chevron-left';

export const StoriesFeedPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const { data: stories, total, loading, error } = useStories({ page, pageSize });
  const pageCount = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <>
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
                ? stories.map((s) => (
                    <StoryCard
                      key={s.slug}
                      title={s.title}
                      authorName={s.authorName}
                      slug={s.slug}
                      headline={s.headline}
                      assets={s.assets}
                      stats={s.stats}
                    />
                  ))
                : (
                  <div role="status" aria-live="polite" className="col-span-full text-center font-mono text-label text-ui-muted">
                    There are no stories yet.
                  </div>
                )}
          </div>
          {error ? (
            <div className="mt-spacing-md col-span-full text-center text-alert font-mono">Failed to load stories.</div>
          ) : null}
        </div>
      </section>

      {/* Pagination */}
      <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-lg mb-spacing-2xl">
        <div className="flex items-center justify-center gap-spacing-md">
          <NavItem
            variant="icon+text-secondary"
            label="Previous"
            icon={<IconChevronLeft className="w-4 h-4" />}
            onClick={page === 1 ? undefined : () => setPage((p) => Math.max(1, p - 1))}
            className={page === 1 ? "opacity-60 cursor-not-allowed" : ""}
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
            onClick={page === pageCount ? undefined : () => setPage((p) => Math.min(pageCount, p + 1))}
            className={page === pageCount ? "opacity-60 cursor-not-allowed" : ""}
          />
        </div>
      </div>
    </>
  );
};
