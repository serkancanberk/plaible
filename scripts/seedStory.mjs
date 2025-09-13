import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  const doc = {
    _id: 'story_dorian_gray',
    slug: 'the-picture-of-dorian-gray',
    mainCategory: 'book',
    subCategory: 'Gothic',
    title: 'The Picture of Dorian Gray',
    authorName: 'Oscar Wilde',
    publisher: 'Public Domain',
    genres: ['Gothic','Psychological','Philosophical'],
    publishedEra: '1890s',
    publishedYear: 1890,
    headline: 'Beauty without consequence carries the heaviest cost.',
    description: 'A striking young man bargains with fate so that a portrait will bear the burden of his sins while he remains flawless.',
    language: 'en',
    license: 'public-domain',
    contentRating: 'PG-13',
    tags: ['classic','vanity','morality','victorian','tragic'],
    assets: {
      images: ['https://cdn.plaible.art/stories/dorian-gray/cover.jpg'],
      videos: ['https://cdn.plaible.art/stories/dorian-gray/teaser.mp4'],
      ambiance: ['https://www.youtube.com/watch?v=VZ6p_ambient_dorian']
    },
    characters: [
      { id:'chr_dorian', name:'Dorian Gray', summary:'A young aristocrat whose beauty becomes a dangerous creed.', hooks:['vanity','temptation','corruption'], assets:{ images:['https://cdn.plaible.art/stories/dorian-gray/characters/dorian.jpg'], videos:['https://cdn.plaible.art/stories/dorian-gray/characters/dorian.mp4'] } },
      { id:'chr_henry',  name:'Lord Henry Wotton', summary:'A witty cynic who preaches pleasure above all.', hooks:['cynicism','influence','decadence'], assets:{ images:['https://cdn.plaible.art/stories/dorian-gray/characters/henry.jpg'], videos:['https://cdn.plaible.art/stories/dorian-gray/characters/henry.mp4'] } },
      { id:'chr_basil',  name:'Basil Hallward', summary:'The devoted painter who sees the soul behind the face.', hooks:['art','devotion','truth'], assets:{ images:['https://cdn.plaible.art/stories/dorian-gray/characters/basil.jpg'], videos:['https://cdn.plaible.art/stories/dorian-gray/characters/basil.mp4'] } },
      { id:'chr_sibyl',  name:'Sibyl Vane', summary:'A tender actress whose love story turns tragic.', hooks:['innocence','romance','tragedy'], assets:{ images:['https://cdn.plaible.art/stories/dorian-gray/characters/sibyl.jpg'], videos:['https://cdn.plaible.art/stories/dorian-gray/characters/sibyl.mp4'] } }
    ],
    roles: [
      { id:'role_hero', label:'Hero' },
      { id:'role_villain', label:'Villain' },
      { id:'role_side', label:'Side Character' },
      { id:'role_other', label:'Other' }
    ],
    cast: [
      { characterId:'chr_dorian', roleIds:['role_hero','role_villain'] },
      { characterId:'chr_henry',  roleIds:['role_villain'] },
      { characterId:'chr_basil',  roleIds:['role_side'] },
      { characterId:'chr_sibyl',  roleIds:['role_side'] }
    ],
    hooks: ['A portrait that shows the soul','Pleasure without pause','Beauty as a bargain'],
    summary: {
      original: 'Dorian remains youthful while his hidden portrait grows grotesque with each sin.',
      modern: 'Influencer perfection persists while a secret digital portrait tracks every compromise.',
      highlights: [
        { title:'The Wish at the Easel', description:'Dorian’s longing becomes a quiet pact with consequence.' },
        { title:'The First Betrayal', description:'A choice for pleasure leaves its mark where only the canvas can see.' },
        { title:'The Unveiling', description:'Behind a locked door, the truth ripens into horror.' }
      ]
    },
    funFacts: {
      storyFacts: [{ title:'Scandalous Origins', description:'Early reviews condemned the novel’s morality while praising its style.' }],
      authorInfo: [{ title:'Wilde’s Aphorisms', description:'The book brims with polished paradoxes that made Wilde famous.' }],
      modernEcho: [{ title:'Filters and Facades', description:'The portrait’s deceit mirrors curated feeds and hidden compromises.' }]
    },
    stats: { totalPlayed:0, totalReviews:0, avgRating:0, savedCount:0 },
    share: {
      link: 'https://plaible.art/s/dorian-gray',
      text: 'Step inside Dorian’s world and test the price of beauty.',
      images: ['https://cdn.plaible.art/stories/dorian-gray/social.jpg'],
      videos: ['https://cdn.plaible.art/stories/dorian-gray/social-teaser.mp4']
    },
    feedbacks: [],
    pricing: { creditsPerChapter: 10, estimatedChapterCount: 10 },
    relatedStoryIds: ['story_dracula','story_frankenstein'],
    reengagementTemplates: [
      { trigger:'inactivity>48h', template:'In Basil’s voice: "{displayName}, I finished a study today. The eyes look troubled. Will you come?"', cooldownHours:72, enabled:true },
      { trigger:'lowCredits<100', template:'In Lord Henry’s voice: "Pleasure does not wait for accounts, my dear. Top up and live a little."', cooldownHours:72, enabled:true }
    ],
    storyrunner: {
      storyPrompt: 'You are Plaible\'s Storyrunner. Keep scenes concise, choices meaningful, tone gothic yet modern-readable. Preserve core themes: vanity, influence, hidden corruption. Never reveal the original text verbatim.',
      guardrails: ['No explicit sexual content','No graphic violence','Respect public-domain boundaries','Offer choices or accept free-text at each turn'],
      openingBeats: ['Gallery hush, the portrait unveiled','A whispered philosophy over tea','A decision that seems harmless']
    },
    isActive: true
  };

  await Story.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
  const saved = await Story.findById(doc._id);
  console.log('Saved story:', saved?.title, saved?.slug);

  console.log('Cast check:', Story.validateCastConsistency(saved));
  await mongoose.disconnect();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); }); 