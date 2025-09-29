import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/plaible';

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const stories = db.collection('stories');

  const ops = [
    stories.updateMany({ mainCategory: 'book' }, { $set: { mainCategory: 'books' } }),
    stories.updateMany({ mainCategory: 'story' }, { $set: { mainCategory: 'stories' } }),
    stories.updateMany({ mainCategory: 'biography' }, { $set: { mainCategory: 'biographies' } }),
  ];

  const [r1, r2, r3] = await Promise.all(ops);
  console.log('Updated counts:', {
    book_to_books: r1.modifiedCount,
    story_to_stories: r2.modifiedCount,
    biography_to_biographies: r3.modifiedCount,
  });

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('Migration failed', e);
  process.exit(1);
});


