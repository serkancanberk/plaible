import React, { useState, useEffect } from 'react';
import { getPlayingLast24h, getLatestFeedback, getGlobalStats, PlayingItem, FeedbackItem, Stats } from '../../api/userFeed';
import FeedCard from './FeedCard';

interface RightFeedProps {
  className?: string;
}

const RightFeed: React.FC<RightFeedProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'playing' | 'saying'>('playing');
  const [playingItems, setPlayingItems] = useState<PlayingItem[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [playing, feedback, statsData] = await Promise.all([
          getPlayingLast24h(),
          getLatestFeedback(),
          getGlobalStats()
        ]);
        
        setPlayingItems(playing);
        setFeedbackItems(feedback);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load feed data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const SkeletonCard = () => (
    <div className="bg-secondary border border-neutral-dark rounded-xl p-4 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-600 flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-600 rounded w-full"></div>
          <div className="h-3 bg-gray-600 rounded w-2/3"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-secondary text-text-primary rounded-xl px-6 py-8 flex flex-col gap-6 w-full max-h-full overflow-hidden ${className}`}>
      {/* Tab Navigation */}
      <div role="tablist" className="flex-shrink-0">
        <div className="flex border-b border-gray-700">
          <button
            role="tab"
            aria-selected={activeTab === 'playing'}
            onClick={() => setActiveTab('playing')}
            className={`px-4 py-2 font-sans text-base font-medium border-b-2 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none ${
              activeTab === 'playing'
                ? 'border-b-2 border-accent-gold text-accent-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            What People Are Playing
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'saying'}
            onClick={() => setActiveTab('saying')}
            className={`px-4 py-2 font-sans text-base font-medium border-b-2 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none ${
              activeTab === 'saying'
                ? 'border-b-2 border-accent-gold text-accent-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            What People Are Saying
          </button>
        </div>
      </div>

      {/* Dynamic Card List */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        {loading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : (
          // Actual content
          <>
            {activeTab === 'playing' ? (
              playingItems.map((item) => (
                <FeedCard key={item.id} item={item} type="playing" />
              ))
            ) : (
              feedbackItems.map((item) => (
                <FeedCard key={item.id} item={item} type="saying" />
              ))
            )}
          </>
        )}
      </div>

      {/* Stats Footer */}
      {stats && (
        <div className="flex-shrink-0 pt-6 border-t border-gray-700">
          <p className="text-sm text-text-secondary">
            <span className="text-accent-gold">🌕</span>{' '}
            {formatNumber(stats.playedCount)} stories played by {formatNumber(stats.playersCount)}+ people.
          </p>
        </div>
      )}
    </div>
  );
};

export default RightFeed;
