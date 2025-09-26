// Types aligned with DB responses (no renaming)

export interface DBStoryStats {
  totalPlayed: number | null;
  totalReviews?: number | null;
  avgRating: number | null; // 0–5
  savedCount?: number | null;
}

export interface DBStoryAssets {
  images?: string[];
  videos?: string[];
}

export interface DBStoryListItem {
  _id?: string;
  slug: string;
  title: string;
  authorName?: string;
  mainCategory?: string;
  subCategory?: string;
  genres?: string[];
  headline?: string;
  assets?: DBStoryAssets;
  stats?: DBStoryStats;
}

export interface StoriesListResponse {
  items: DBStoryListItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  ok?: boolean;
}


