import React, { useState } from 'react';
import BaseModal from './BaseModal';
import IconSearch from 'virtual:icons/tabler/search';
import IconX from 'virtual:icons/tabler/x';
import MenuItem from '../../MenuItem';
import { useSearchStories } from '../../../hooks/useSearchStories';
import { Input } from '../Input';

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
};

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the search hook for dynamic data
  const { results, loading, error, recentSearches, addRecentSearch, clearRecentSearches } = useSearchStories(searchQuery);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="SEARCH STORIES"
      subtitle="Find stories by title, author, or theme."
      variant="accent"
    >
      <div className="text-body mb-spacing-md">
      The stories you love are just a search away.
      </div>

      {/* Search Input */}
      <div className="relative mb-spacing-lg">
        <div className="absolute inset-y-0 left-0 pl-spacing-md flex items-center pointer-events-none z-10">
          <IconSearch className="h-5 w-5 text-text-secondary" />
        </div>
        <Input
          variant="default"
          size="md"
          placeholder="Type here"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-spacing-2xl pr-spacing-2xl"
          aria-label="Search Stories"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-spacing-md flex items-center hover:opacity-70 transition-opacity z-10"
            aria-label="Clear search"
          >
            <IconX className="h-5 w-5 text-text-secondary" />
          </button>
        )}
      </div>

      {/* Conditional Content */}
      {searchQuery && searchQuery.length >= 2 ? (
        /* Search Results Section */
        <div>
          <div className="text-label text-text-secondary mb-spacing-sm">Search Results</div>
          {loading ? (
            <div className="p-spacing-md text-body text-text-secondary">Loading...</div>
          ) : error ? (
            <div className="p-spacing-md text-body text-text-secondary">Error loading results</div>
          ) : results.length > 0 ? (
            <div className="space-y-0">
              {results.map((result, index) => (
                <div key={result._id || index} className={index === results.length - 1 ? 'last:border-b-0' : ''}>
                  <button
                    type="button"
                    onClick={() => {
                      addRecentSearch(searchQuery);
                      console.log('Selected story', result);
                    }}
                    className="w-full flex items-center justify-between text-text-primary hover:text-text-secondary active:text-text-tertiary font-mono text-caption pt-spacing-md pb-spacing-xs transition-colors bg-transparent border-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-spacing-md min-w-0 flex-1">
                      {result.assets?.images?.[0] && (
                        <div className="transition-opacity hover:opacity-80">
                          <img 
                            src={result.assets.images[0]} 
                            alt={`${result.title} thumbnail`}
                            className="w-10 h-10 object-cover rounded-sm flex-shrink-0"
                          />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="text-body text-text-primary font-medium truncate">{result.title}</div>
                        {result.authorName && (
                          <div className="text-caption text-text-secondary truncate">{result.authorName}</div>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="h-px w-full bg-text-secondary/25" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-spacing-md text-body text-text-secondary">No results found</div>
          )}
        </div>
      ) : (
        /* Recent Searches Section */
        <div>
          <div className="flex items-center justify-between mb-spacing-sm">
            <div className="text-caption text-text-primary">Recent</div>
            {recentSearches.length > 0 && (
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-caption text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Clear Recent
              </button>
            )}
          </div>
          <div className="space-y-0">
            {recentSearches.length > 0 ? (
              recentSearches.map((search, index) => (
                <MenuItem
                  key={index}
                  variant="SearchRecents"
                  label={search}
                  onClick={() => setSearchQuery(search)}
                  showArrow={false}
                  className={index === recentSearches.length - 1 ? 'last:border-b-0' : ''}
                />
              ))
            ) : (
              <div className="pt-spacing-md pb-spacing-xs">
                <div className="text-caption text-text-secondary italic">No recent searches yet.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default SearchModal;
