// src/config/categoryConfig.ts

export interface I18nLabel {
  en: string;
  tr: string;
}

export interface GenreItem {
  label: I18nLabel;
  value: string;
}

export interface SubCategoryItem {
  label: I18nLabel;
  value: string;
  genres: GenreItem[];
}

export interface CategoryConfigItem {
  label: I18nLabel;
  value: string;
  subCategories: SubCategoryItem[];
}

export const categoryConfig: CategoryConfigItem[] = [
  {
    "label": { "en": "Book", "tr": "Kitap" },
    "value": "book",
    "subCategories": [
      {
        "label": { "en": "Classic Novels", "tr": "Klasik Romanlar" },
        "value": "classic-novels",
        "genres": [
          { "label": { "en": "Gothic", "tr": "Gotik" }, "value": "gothic" },
          { "label": { "en": "Philosophical", "tr": "Felsefi" }, "value": "philosophical" },
          { "label": { "en": "Psychological", "tr": "Psikolojik" }, "value": "psychological" },
          { "label": { "en": "Bildungsroman", "tr": "Bildungsroman" }, "value": "bildungsroman" }
        ]
      },
      {
        "label": { "en": "Sci-Fi & Fantasy", "tr": "Bilim Kurgu ve Fantezi" },
        "value": "sci-fi-fantasy",
        "genres": [
          { "label": { "en": "Science Fiction", "tr": "Bilim Kurgu" }, "value": "science-fiction" },
          { "label": { "en": "Dystopian", "tr": "Distopik" }, "value": "dystopian" },
          { "label": { "en": "Fantasy", "tr": "Fantezi" }, "value": "fantasy" },
          { "label": { "en": "Cyberpunk", "tr": "Siberpunk" }, "value": "cyberpunk" }
        ]
      },
      {
        "label": { "en": "Historical Fiction", "tr": "Tarihi Kurgu" },
        "value": "historical-fiction",
        "genres": [
          { "label": { "en": "War", "tr": "Savaş" }, "value": "war" },
          { "label": { "en": "Political", "tr": "Politik" }, "value": "political" },
          { "label": { "en": "Revolution", "tr": "Devrim" }, "value": "revolution" },
          { "label": { "en": "Period Romance", "tr": "Dönem Aşkı" }, "value": "period-romance" }
        ]
      },
      {
        "label": { "en": "Modern Literature", "tr": "Modern Edebiyat" },
        "value": "modern-literature",
        "genres": [
          { "label": { "en": "Contemporary", "tr": "Çağdaş" }, "value": "contemporary" },
          { "label": { "en": "Satire", "tr": "Satir" }, "value": "satire" },
          { "label": { "en": "Postmodern", "tr": "Postmodern" }, "value": "postmodern" }
        ]
      },
      {
        "label": { "en": "Children's Literature", "tr": "Çocuk Edebiyatı" },
        "value": "childrens-literature",
        "genres": [
          { "label": { "en": "Fairy Tale", "tr": "Masal" }, "value": "fairy-tale" },
          { "label": { "en": "Adventure", "tr": "Macera" }, "value": "adventure" },
          { "label": { "en": "Animal Story", "tr": "Hayvan Hikayesi" }, "value": "animal-story" }
        ]
      },
      {
        "label": { "en": "Philosophical Works", "tr": "Felsefi Eserler" },
        "value": "philosophical-works",
        "genres": [
          { "label": { "en": "Ethics", "tr": "Etik" }, "value": "ethics" },
          { "label": { "en": "Metaphysics", "tr": "Metafizik" }, "value": "metaphysics" },
          { "label": { "en": "Existentialism", "tr": "Varoluşçuluk" }, "value": "existentialism" }
        ]
      },
      {
        "label": { "en": "Religious / Mythological Works", "tr": "Dini / Mitolojik Eserler" },
        "value": "religious-mythological",
        "genres": [
          { "label": { "en": "Bible Stories", "tr": "İncil Hikayeleri" }, "value": "bible-stories" },
          { "label": { "en": "Greek Myth", "tr": "Yunan Mitolojisi" }, "value": "greek-myth" },
          { "label": { "en": "Sufi Tales", "tr": "Tasavvuf Hikayeleri" }, "value": "sufi-tales" }
        ]
      },
      {
        "label": { "en": "Horror", "tr": "Korku" },
        "value": "horror",
        "genres": [
          { "label": { "en": "Supernatural", "tr": "Doğaüstü" }, "value": "supernatural" },
          { "label": { "en": "Paranormal", "tr": "Paranormal" }, "value": "paranormal" },
          { "label": { "en": "Thriller", "tr": "Gerilim" }, "value": "thriller" }
        ]
      },
      {
        "label": { "en": "Adventure", "tr": "Macera" },
        "value": "adventure",
        "genres": [
          { "label": { "en": "Quest", "tr": "Arayış" }, "value": "quest" },
          { "label": { "en": "Survival", "tr": "Hayatta Kalma" }, "value": "survival" },
          { "label": { "en": "Expedition", "tr": "Keşif" }, "value": "expedition" }
        ]
      },
      {
        "label": { "en": "Romance", "tr": "Romantik" },
        "value": "romance",
        "genres": [
          { "label": { "en": "Classic Romance", "tr": "Klasik Aşk" }, "value": "classic-romance" },
          { "label": { "en": "Forbidden Love", "tr": "Yasak Aşk" }, "value": "forbidden-love" },
          { "label": { "en": "Tragic Love", "tr": "Trajik Aşk" }, "value": "tragic-love" }
        ]
      }
    ]
  },
  {
    "label": { "en": "Story", "tr": "Hikaye" },
    "value": "story",
    "subCategories": [
      {
        "label": { "en": "Short Fiction", "tr": "Kısa Kurgu" },
        "value": "short-fiction",
        "genres": [
          { "label": { "en": "Flash Fiction", "tr": "Flash Kurgu" }, "value": "flash-fiction" },
          { "label": { "en": "Microfiction", "tr": "Mikro Kurgu" }, "value": "microfiction" },
          { "label": { "en": "Character-Driven", "tr": "Karakter Odaklı" }, "value": "character-driven" }
        ]
      },
      {
        "label": { "en": "Folktales & Fairy Tales", "tr": "Halk Masalları ve Peri Masalları" },
        "value": "folktales-fairy-tales",
        "genres": [
          { "label": { "en": "Moral Tale", "tr": "Ahlak Hikayesi" }, "value": "moral-tale" },
          { "label": { "en": "Trickster", "tr": "Düzenbaz" }, "value": "trickster" },
          { "label": { "en": "Heroic", "tr": "Kahramanlık" }, "value": "heroic" }
        ]
      },
      {
        "label": { "en": "Urban Legends", "tr": "Şehir Efsaneleri" },
        "value": "urban-legends",
        "genres": [
          { "label": { "en": "Creepy", "tr": "Ürpertici" }, "value": "creepy" },
          { "label": { "en": "Mysterious", "tr": "Gizemli" }, "value": "mysterious" },
          { "label": { "en": "Dark Humor", "tr": "Kara Mizah" }, "value": "dark-humor" }
        ]
      },
      {
        "label": { "en": "Modern Short Stories", "tr": "Modern Kısa Hikayeler" },
        "value": "modern-short-stories",
        "genres": [
          { "label": { "en": "Slice of Life", "tr": "Hayattan Kesit" }, "value": "slice-of-life" },
          { "label": { "en": "Stream of Consciousness", "tr": "Bilinç Akışı" }, "value": "stream-of-consciousness" },
          { "label": { "en": "Absurd", "tr": "Absürt" }, "value": "absurd" }
        ]
      },
      {
        "label": { "en": "AI-Generated Stories", "tr": "AI Üretimi Hikayeler" },
        "value": "ai-generated-stories",
        "genres": [
          { "label": { "en": "Experimental", "tr": "Deneysel" }, "value": "experimental" },
          { "label": { "en": "Prompt-Based", "tr": "Prompt Tabanlı" }, "value": "prompt-based" },
          { "label": { "en": "Genre-Bending", "tr": "Tür Kıran" }, "value": "genre-bending" }
        ]
      },
      {
        "label": { "en": "Kids' Stories", "tr": "Çocuk Hikayeleri" },
        "value": "kids-stories",
        "genres": [
          { "label": { "en": "Animal Story", "tr": "Hayvan Hikayesi" }, "value": "animal-story" },
          { "label": { "en": "Fantasy", "tr": "Fantezi" }, "value": "fantasy" },
          { "label": { "en": "Educational", "tr": "Eğitici" }, "value": "educational" }
        ]
      }
    ]
  },
  {
    "label": { "en": "Biography", "tr": "Biyografi" },
    "value": "biography",
    "subCategories": [
      {
        "label": { "en": "Historical Figures", "tr": "Tarihi Şahsiyetler" },
        "value": "historical-figures",
        "genres": [
          { "label": { "en": "Political Leader", "tr": "Politik Lider" }, "value": "political-leader" },
          { "label": { "en": "Scientist", "tr": "Bilim İnsanı" }, "value": "scientist" },
          { "label": { "en": "Philosopher", "tr": "Filozof" }, "value": "philosopher" }
        ]
      },
      {
        "label": { "en": "Literary Biographies", "tr": "Edebi Biyografiler" },
        "value": "literary-biographies",
        "genres": [
          { "label": { "en": "Author Story", "tr": "Yazar Hikayesi" }, "value": "author-story" },
          { "label": { "en": "Memoir", "tr": "Anı" }, "value": "memoir" },
          { "label": { "en": "Literary Criticism", "tr": "Edebi Eleştiri" }, "value": "literary-criticism" }
        ]
      },
      {
        "label": { "en": "Artists & Creators", "tr": "Sanatçılar ve Yaratıcılar" },
        "value": "artists-creators",
        "genres": [
          { "label": { "en": "Painter", "tr": "Ressam" }, "value": "painter" },
          { "label": { "en": "Sculptor", "tr": "Heykeltıraş" }, "value": "sculptor" },
          { "label": { "en": "Director", "tr": "Yönetmen" }, "value": "director" },
          { "label": { "en": "Composer", "tr": "Besteci" }, "value": "composer" }
        ]
      },
      {
        "label": { "en": "Women in History", "tr": "Tarihteki Kadınlar" },
        "value": "women-in-history",
        "genres": [
          { "label": { "en": "Feminist Icons", "tr": "Feminist İkonlar" }, "value": "feminist-icons" },
          { "label": { "en": "Female Leaders", "tr": "Kadın Liderler" }, "value": "female-leaders" }
        ]
      },
      {
        "label": { "en": "Autobiographies & Memoirs", "tr": "Otobiyografiler ve Anılar" },
        "value": "autobiographies-memoirs",
        "genres": [
          { "label": { "en": "Coming of Age", "tr": "Olgunlaşma" }, "value": "coming-of-age" },
          { "label": { "en": "Trauma & Healing", "tr": "Travma ve İyileşme" }, "value": "trauma-healing" },
          { "label": { "en": "Personal Growth", "tr": "Kişisel Gelişim" }, "value": "personal-growth" }
        ]
      },
      {
        "label": { "en": "Inspirational Lives", "tr": "İlham Verici Hayatlar" },
        "value": "inspirational-lives",
        "genres": [
          { "label": { "en": "Rags to Riches", "tr": "Fakirlikten Zenginliğe" }, "value": "rags-to-riches" },
          { "label": { "en": "Overcoming Adversity", "tr": "Zorlukları Aşma" }, "value": "overcoming-adversity" }
        ]
      }
    ]
  }
];