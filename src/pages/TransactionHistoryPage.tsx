import React, { useEffect, useMemo, useState } from 'react';

type TxItem = {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  storyId?: string | null;
  chapter?: number | null;
  provider?: string;
  providerRef?: string;
  createdAt: string;
  balanceAfter?: number; // optional - only if backend mapping includes it
};

type TxResponse = {
  ok: boolean;
  items: TxItem[];
  nextCursor?: string;
};

export const TransactionHistoryPage: React.FC = () => {
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    console.log('[CREDITS_UI][CREDIT_JOURNAL] page loaded');
  }, []);

  const fetchTransactions = async (cursor?: string) => {
    const qs = new URLSearchParams();
    qs.set('limit', '20');
    if (cursor) qs.set('cursor', cursor);
    const url = `/api/wallet/transactions?${qs.toString()}`;
    console.log('[CREDITS_UI][TX_HISTORY] fetch:start', { url });
    const res = await fetch(url, { credentials: 'include' });
    const data: TxResponse = await res.json();
    if (!res.ok || !data?.ok) {
      throw new Error((data as any)?.error || `Request failed: ${res.status}`);
    }
    return data;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTransactions()
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setNextCursor(data.nextCursor);
        console.log('[CREDITS_UI][TX_HISTORY] fetch:success', { count: data.items?.length || 0, nextCursor: data.nextCursor });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[CREDITS_UI][TX_HISTORY] fetch:error', err);
        setError(err?.message || 'Failed to load transactions');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const onLoadMore = async () => {
    if (!nextCursor) return;
    try {
      setIsLoadingMore(true);
      const data = await fetchTransactions(nextCursor);
      setItems((prev) => {
        const merged = [...prev, ...(data.items || [])];
        console.log('[CREDITS_UI][TX_HISTORY] fetch:append', { added: data.items?.length || 0, total: merged.length });
        return merged;
      });
      setNextCursor(data.nextCursor);
    } catch (err: any) {
      console.error('[CREDITS_UI][TX_HISTORY] fetch:error', err);
      setError(err?.message || 'Failed to load more transactions');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const renderAmount = (tx: TxItem) => {
    const sign = tx.type === 'credit' ? '+' : '-';
    return `${sign}${tx.amount}`;
  };

  const formattedItems = useMemo(() => {
    const formatDate = (iso: string) => {
      try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        const dd = pad(d.getDate());
        const mm = pad(d.getMonth() + 1);
        const yyyy = d.getFullYear();
        const HH = pad(d.getHours());
        const MM = pad(d.getMinutes());
        return `${dd}.${mm}.${yyyy} ${HH}:${MM}`;
      } catch {
        return iso;
      }
    };
    return items.map((tx) => ({
      id: tx._id,
      date: formatDate(tx.createdAt),
      type: tx.type,
      source: (tx as any).source || tx.provider || '—',
      amountText: renderAmount(tx),
      balanceAfter: tx.balanceAfter,
    }));
  }, [items]);

  return (
    <section className="px-spacing-lg py-spacing-md w-full">
      <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl">
        <h1 className="text-heading font-serif text-accent">Credit Journal</h1>
        <p className="text-body text-text-secondary mt-spacing-md">Your recent wallet activity.</p>
        <div className="mt-spacing-sm border-b border-text-secondary/20" />

        {loading && (
          <div className="mt-spacing-lg text-mono text-label text-ui-muted">Loading…</div>
        )}

        {error && !loading && (
          <div className="mt-spacing-lg text-mono text-label text-alert">{error}</div>
        )}

        {!loading && !error && formattedItems.length === 0 && (
          <div className="mt-spacing-lg text-mono text-label text-ui-muted">No transactions yet.</div>
        )}

        {!loading && !error && formattedItems.length > 0 && (
          <div className="mt-spacing-lg">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="text-left border-b border-text-secondary/20">
                    <th className="py-spacing-xs pr-spacing-md text-mono text-label text-text-primary">Date</th>
                    <th className="py-spacing-xs pr-spacing-md text-mono text-label text-text-primary">Type</th>
                    <th className="py-spacing-xs pr-spacing-md text-mono text-label text-text-primary">Source</th>
                    <th className="py-spacing-xs pr-spacing-md text-mono text-label text-text-primary text-right">Amount</th>
                    {formattedItems.some(i => i.balanceAfter !== undefined) && (
                      <th className="py-spacing-xs pr-spacing-md text-mono text-label text-text-primary text-right">Balance After</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {formattedItems.map((row) => (
                    <tr key={row.id} className="border-b border-text-secondary/20">
                      <td className="py-spacing-xs pr-spacing-md text-body text-ui-muted whitespace-nowrap">{row.date}</td>
                      <td className="py-spacing-xs pr-spacing-md text-body text-text-primary">
                        {row.type === 'credit' ? (
                          <span className="text-accent">credit</span>
                        ) : (
                          <span className="text-alert">debit</span>
                        )}
                      </td>
                      <td className="py-spacing-xs pr-spacing-md text-body text-text-primary">{row.source}</td>
                      <td className="py-spacing-xs pr-spacing-md text-body text-text-primary text-right font-mono">{row.amountText}</td>
                      {row.balanceAfter !== undefined && (
                        <td className="py-spacing-xs pr-spacing-md text-body text-text-primary text-right">{row.balanceAfter}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {nextCursor && (
              <div className="mt-spacing-md">
                <button
                  className="px-spacing-md py-spacing-xs rounded-md border border-text-secondary/30 text-mono text-label text-accent hover:bg-accent/10 disabled:opacity-50"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionHistoryPage;


