export type PlayingItem = {
  id: string;
  userName: string;
  avatarUrl: string;
  characterName: string;
  storyTitle?: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export type FeedbackItem = {
  id: string;
  userName: string;
  avatarUrl: string;
  text: string;
  href: string;
};

export type Stats = {
  playedCount: number;
  playersCount: number;
};

// Mock data for playing items
const mockPlayingItems: PlayingItem[] = [
  {
    id: '1',
    userName: 'Jennifer',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    characterName: 'Dracula',
    storyTitle: 'Dracula',
    description: 'Short description about the Dracula story and the Dracula character...',
    ctaLabel: 'Drink in the night as Dracula',
    href: '#'
  },
  {
    id: '2',
    userName: 'Username',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    characterName: 'Dorian Gray',
    storyTitle: 'The Picture Of Dorian Gray',
    description: 'Short description about The Picture Of Dorian Gray story and the Dorian Gray character.',
    ctaLabel: 'Face the truth as Dorian Gray',
    href: '#'
  },
  {
    id: '3',
    userName: 'Ali',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    characterName: 'Kont de Morcerf',
    storyTitle: 'The Count of Monte Cristo',
    description: 'Short description about The Count of Monte Cristo and the playing Fernando Mondego...',
    ctaLabel: 'Play your betrayal as Count de Morcerf',
    href: '#'
  },
  {
    id: '4',
    userName: 'Sarah',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    characterName: 'Elizabeth Bennet',
    storyTitle: 'Pride and Prejudice',
    description: 'Navigating the social complexities of Regency England as the witty and independent Elizabeth.',
    ctaLabel: 'Dance with Mr. Darcy as Elizabeth',
    href: '#'
  },
  {
    id: '5',
    userName: 'Marcus',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    characterName: 'Sherlock Holmes',
    storyTitle: 'The Adventures of Sherlock Holmes',
    description: 'Solving mysteries in Victorian London with keen observation and deductive reasoning.',
    ctaLabel: 'Solve the case as Sherlock',
    href: '#'
  }
];

// Mock data for feedback items
const mockFeedbackItems: FeedbackItem[] = [
  {
    id: '1',
    userName: 'Emma',
    avatarUrl: 'https://i.pravatar.cc/150?img=6',
    text: 'This platform completely changed how I experience stories. The AI adapts so naturally to my choices!',
    href: '#'
  },
  {
    id: '2',
    userName: 'David',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    text: 'Finally, a storytelling app that lets me be the protagonist. The character development is incredible.',
    href: '#'
  },
  {
    id: '3',
    userName: 'Lisa',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    text: 'I love how every playthrough feels unique. The AI remembers my previous choices and builds on them.',
    href: '#'
  },
  {
    id: '4',
    userName: 'Alex',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    text: 'The writing quality is amazing. It feels like reading a professionally written novel, but I\'m the main character.',
    href: '#'
  }
];

// Mock stats
const mockStats: Stats = {
  playedCount: 404852,
  playersCount: 1000
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPlayingLast24h = async (): Promise<PlayingItem[]> => {
  await delay(800 + Math.random() * 400); // 800-1200ms delay
  return mockPlayingItems;
};

export const getLatestFeedback = async (): Promise<FeedbackItem[]> => {
  await delay(600 + Math.random() * 300); // 600-900ms delay
  return mockFeedbackItems;
};

export const getGlobalStats = async (): Promise<Stats> => {
  await delay(400 + Math.random() * 200); // 400-600ms delay
  return mockStats;
};
