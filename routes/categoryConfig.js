// routes/categoryConfig.js
import express from 'express';
import { authGuard } from '../server.js';
import adminGuard from '../middleware/adminGuard.js';

const router = express.Router();

// POST /api/category-config - Save category configuration
router.post('/', authGuard, adminGuard, async (req, res) => {
  try {
    const { config } = req.body;
    
    // Basic validation
    if (!Array.isArray(config)) {
      return res.status(400).json({
        ok: false,
        error: 'Configuration must be an array'
      });
    }

    // Validate structure
    for (const category of config) {
      if (!category.label || !category.value || !Array.isArray(category.subCategories)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid category structure'
        });
      }
    }

    // In a real implementation, you would save this to a database
    // For now, we'll just log it and return success
    console.log('Category configuration saved:', JSON.stringify(config, null, 2));
    
    // You could save to MongoDB like this:
    // await CategoryConfig.findOneAndUpdate(
    //   { type: 'stories' },
    //   { config, updatedAt: new Date() },
    //   { upsert: true }
    // );

    res.json({
      ok: true,
      message: 'Category configuration saved successfully'
    });

  } catch (error) {
    console.error('Error saving category configuration:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save category configuration'
    });
  }
});

// GET /api/category-config - Get current category configuration
router.get('/', authGuard, adminGuard, async (req, res) => {
  try {
    // In a real implementation, you would fetch from database
    // For now, return the static config
    const { categoryConfig } = await import('../src/config/categoryConfig.js');
    
    res.json({
      ok: true,
      config: categoryConfig
    });

  } catch (error) {
    console.error('Error fetching category configuration:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch category configuration'
    });
  }
});

export default router;
