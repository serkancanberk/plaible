import 'dotenv/config';
import mongoose from 'mongoose';
import { Story } from '../models/Story.js';
import { MAIN_CATEGORIES } from '../src/config/categoryEnums.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateCategories() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  try {
    // 1. Update Dorian Gray to correct categories
    console.log('🔄 Updating Dorian Gray categories...');
    const dorianResult = await Story.updateOne(
      { slug: 'the-picture-of-dorian-gray' },
      { 
        $set: { 
          mainCategory: 'books', 
          subCategory: 'classic-novels' 
        } 
      }
    );
    console.log('✅ Dorian Gray updated:', dorianResult.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGES');

    // 2. Check if Frankenstein exists, create if missing
    console.log('🔄 Checking Frankenstein...');
    let frankenstein = await Story.findOne({ slug: 'frankenstein' });
    
    if (!frankenstein) {
      console.log('📝 Creating Frankenstein story...');
      frankenstein = new Story({
        _id: 'story_frankenstein',
        slug: 'frankenstein',
        mainCategory: 'books',
        subCategory: 'classic-novels',
        title: 'Frankenstein',
        authorName: 'Mary Shelley',
        publisher: 'Public Domain',
        genres: ['Gothic', 'Philosophical', 'Horror'],
        storySettingTime: 'Switzerland, 1790s',
        publishedYear: 1818,
        headline: 'The monster within us all is the one we create ourselves.',
        description: 'A brilliant scientist creates life from death, but his creation becomes a monster that haunts him across Europe.',
        language: 'en',
        license: 'public-domain',
        contentRating: 'PG-13',
        tags: ['classic', 'gothic', 'horror', 'science', 'tragic'],
        assets: {
          images: ['https://cdn.plaible.art/stories/frankenstein/cover.jpg'],
          videos: ['https://cdn.plaible.art/stories/frankenstein/teaser.mp4'],
          ambiance: ['https://www.youtube.com/watch?v=frankenstein_ambient']
        },
        characters: [
          { 
            id: 'chr_victor', 
            name: 'Victor Frankenstein', 
            summary: 'The ambitious scientist who creates life from death.', 
            hooks: ['ambition', 'guilt', 'responsibility'],
            assets: { 
              images: ['https://cdn.plaible.art/stories/frankenstein/characters/victor.jpg'],
              videos: ['https://cdn.plaible.art/stories/frankenstein/characters/victor.mp4']
            }
          },
          { 
            id: 'chr_creature', 
            name: 'The Creature', 
            summary: 'The misunderstood being created by Victor.', 
            hooks: ['loneliness', 'revenge', 'humanity'],
            assets: { 
              images: ['https://cdn.plaible.art/stories/frankenstein/characters/creature.jpg'],
              videos: ['https://cdn.plaible.art/stories/frankenstein/characters/creature.mp4']
            }
          },
          { 
            id: 'chr_elizabeth', 
            name: 'Elizabeth Lavenza', 
            summary: 'Victor\'s gentle and devoted fiancée.', 
            hooks: ['love', 'innocence', 'tragedy'],
            assets: { 
              images: ['https://cdn.plaible.art/stories/frankenstein/characters/elizabeth.jpg'],
              videos: ['https://cdn.plaible.art/stories/frankenstein/characters/elizabeth.mp4']
            }
          },
          { 
            id: 'chr_walton', 
            name: 'Captain Walton', 
            summary: 'The Arctic explorer who records Victor\'s tale.', 
            hooks: ['exploration', 'friendship', 'ambition'],
            assets: { 
              images: ['https://cdn.plaible.art/stories/frankenstein/characters/walton.jpg'],
              videos: ['https://cdn.plaible.art/stories/frankenstein/characters/walton.mp4']
            }
          }
        ],
        roles: [
          { id: 'role_hero', label: 'Hero' },
          { id: 'role_villain', label: 'Villain' },
          { id: 'role_side', label: 'Side Character' },
          { id: 'role_narrator', label: 'Narrator' }
        ],
        cast: [
          { characterId: 'chr_victor', roleIds: ['role_hero'] },
          { characterId: 'chr_creature', roleIds: ['role_villain'] },
          { characterId: 'chr_elizabeth', roleIds: ['role_side'] },
          { characterId: 'chr_walton', roleIds: ['role_narrator'] }
        ],
        hooks: ['creation', 'responsibility', 'isolation', 'revenge'],
        summary: {
          original: 'Victor Frankenstein creates life from death, but his creation becomes his tormentor.',
          modern: 'A brilliant scientist plays god and creates life, but his creation becomes a monster that haunts him.',
          highlights: [
            {
              title: 'The Creation',
              description: 'Victor brings his creature to life in a moment of scientific triumph.'
            },
            {
              title: 'The Rejection',
              description: 'Victor abandons his creation, leading to tragedy and revenge.'
            },
            {
              title: 'The Pursuit',
              description: 'Victor and his creation chase each other across Europe in a deadly game.'
            }
          ]
        },
        funFacts: {
          storyFacts: [
            { title: 'First Science Fiction', description: 'Often considered the first science fiction novel.' },
            { title: 'Written in a Contest', description: 'Written during a ghost story contest with Lord Byron.' }
          ],
          authorInfo: [
            { title: 'Young Author', description: 'Mary Shelley was only 18 when she wrote Frankenstein.' },
            { title: 'Feminist Pioneer', description: 'One of the first major female science fiction authors.' }
          ],
          modernEcho: [
            { title: 'AI Ethics', description: 'Raises questions about artificial intelligence and responsibility.' },
            { title: 'Bioethics', description: 'Relevant to modern debates about genetic engineering.' }
          ]
        },
        stats: {
          totalPlayed: 0,
          totalReviews: 0,
          avgRating: 0,
          savedCount: 0
        },
        share: {
          link: 'https://plaible.art/s/frankenstein',
          text: 'Experience the classic tale of creation and responsibility in Frankenstein',
          images: ['https://cdn.plaible.art/stories/frankenstein/social.jpg'],
          videos: ['https://cdn.plaible.art/stories/frankenstein/social-teaser.mp4']
        },
        feedbacks: [],
        pricing: {
          creditsPerChapter: 10,
          estimatedChapterCount: 8
        },
        relatedStoryIds: ['story_dorian_gray', 'story_dracula'],
        featured: false,
        reengagementTemplates: [],
        storyrunner: {
          storyPrompt: 'You are experiencing the world of Frankenstein. Choose your character and navigate the moral complexities of creation and responsibility.',
          systemPrompt: 'You are the StoryRunner for Frankenstein. Guide the user through the classic tale of Victor Frankenstein and his creation.',
          editableFinalPrompt: 'You are the StoryRunner for Frankenstein. Guide the user through the classic tale of Victor Frankenstein and his creation.',
          guardrails: [
            'Maintain the gothic atmosphere',
            'Explore themes of responsibility and creation',
            'Stay true to the original characters'
          ],
          openingBeats: [
            'The storm rages outside your laboratory',
            'Your creation lies before you, waiting for life',
            'The weight of playing god presses on your shoulders'
          ]
        },
        isActive: true
      });
      
      await frankenstein.save();
      console.log('✅ Frankenstein created successfully');
    } else {
      console.log('✅ Frankenstein already exists');
    }

    // 3. Normalize all existing stories
    console.log('🔄 Normalizing all story categories...');
    const allStories = await Story.find({});
    let normalizedCount = 0;
    let invalidCount = 0;

    for (const story of allStories) {
      let needsUpdate = false;
      const updates = {};

      // Normalize mainCategory
      const normalizedMain = story.mainCategory?.toLowerCase().trim();
      if (normalizedMain !== story.mainCategory) {
        updates.mainCategory = normalizedMain;
        needsUpdate = true;
      }

      // Normalize subCategory
      if (story.subCategory) {
        const normalizedSub = story.subCategory.toLowerCase().replace(/\s+/g, '-');
        if (normalizedSub !== story.subCategory) {
          updates.subCategory = normalizedSub;
          needsUpdate = true;
        }
      }

      // Validate mainCategory against enum
      if (!MAIN_CATEGORIES.includes(normalizedMain)) {
        console.log(`❌ Invalid mainCategory for ${story.slug}: ${normalizedMain}`);
        invalidCount++;
        // Set to default 'books' if invalid
        updates.mainCategory = 'books';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Story.updateOne({ _id: story._id }, { $set: updates });
        normalizedCount++;
        console.log(`✅ Normalized ${story.slug}:`, updates);
      }
    }

    console.log(`✅ Normalization complete: ${normalizedCount} stories updated, ${invalidCount} invalid categories fixed`);

    // 4. Verify the target stories exist with correct categories
    console.log('🔍 Verifying target stories...');
    const targetStories = await Story.find({
      mainCategory: 'books',
      subCategory: 'classic-novels'
    });

    console.log(`✅ Found ${targetStories.length} stories in books/classic-novels:`);
    targetStories.forEach(story => {
      console.log(`  - ${story.title} by ${story.authorName} (${story.slug})`);
    });

    // 5. Test API filtering
    console.log('🧪 Testing API filtering...');
    const filteredStories = await Story.find({
      mainCategory: 'books',
      subCategory: 'classic-novels',
      isActive: true
    }).select('_id slug title authorName mainCategory subCategory');

    console.log(`✅ API filter test: Found ${filteredStories.length} stories`);
    filteredStories.forEach(story => {
      console.log(`  - ${story.title} (${story.slug})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Mongo disconnected');
  }
}

// Run the migration
migrateCategories().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
