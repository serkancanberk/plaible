import React from 'react';
import { PlayingItem, FeedbackItem } from '../../api/userFeed';

interface FeedCardProps {
  item: PlayingItem | FeedbackItem;
  type: 'playing' | 'saying';
}

const FeedCard: React.FC<FeedCardProps> = ({ item, type }) => {
  const isPlaying = type === 'playing';
  const playingItem = isPlaying ? item as PlayingItem : null;

  return (
    <div className="bg-secondary text-text-primary rounded-xl border border-neutral-dark p-4 shadow-sm focus-within:ring-2 focus-within:ring-accent-gold/50 transition-shadow duration-200">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <img
          src={item.avatarUrl}
          alt={`${item.userName}'s avatar`}
          className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* User and Action Line */}
          <div className="mb-2">
            {isPlaying && playingItem ? (
              <p className="text-text-primary text-sm">
                <span className="font-medium">{item.userName}</span> is playing as{' '}
                <span className="text-accent-gold font-medium">{playingItem.characterName}</span>
              </p>
            ) : (
              <p className="text-text-primary text-sm">
                <span className="font-medium">{item.userName}</span> says
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-text-secondary line-clamp-3 text-sm mb-3">
            {isPlaying && playingItem ? playingItem.description : (item as FeedbackItem).text}
          </p>

          {/* CTA Link */}
          <a
            href={item.href}
            className="inline-flex items-center text-accent-gold text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:outline-none transition-colors duration-200"
          >
            {isPlaying && playingItem ? playingItem.ctaLabel : 'Read more'}
            <span className="ml-1">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeedCard;
