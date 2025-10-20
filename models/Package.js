import mongoose from "mongoose";

const { Schema, model } = mongoose;

const packageSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 100 
    },
    credits: { 
      type: Number, 
      required: true, 
      min: 0,
      default: 0 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    bonus: { 
      type: Number, 
      required: true,
      min: 0,
      default: 0 
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true 
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true
    },
    metadata: {
      currency: { 
        type: String, 
        default: 'USD',
        enum: ['USD', 'EUR', 'GBP', 'CAD']
      },
      stripeProductId: { 
        type: String,
        trim: true
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
packageSchema.index({ isActive: 1, sortOrder: 1 });
packageSchema.index({ isPopular: 1, isActive: 1 });
packageSchema.index({ createdAt: -1 });

// Virtual for total credits (base + bonus)
packageSchema.virtual('totalCredits').get(function() {
  const credits = Number(this.credits) || 0;
  const bonus = Number(this.bonus) || 0;
  return credits + bonus;
});

// Virtual for price per credit
packageSchema.virtual('pricePerCredit').get(function() {
  const price = Number(this.price);
  const total = this.totalCredits; // virtual above
  if (!isFinite(price) || !isFinite(total) || total <= 0) return null;
  return price / total;
});

// Virtual for bonus percentage
packageSchema.virtual('bonusPercentage').get(function() {
  const credits = Number(this.credits) || 0;
  const bonus = Number(this.bonus) || 0;
  if (credits <= 0) return 0;
  return Math.round((bonus / credits) * 100);
});

// Ensure virtual fields are serialized
packageSchema.set('toJSON', { virtuals: true });
packageSchema.set('toObject', { virtuals: true });

// Static method to get active packages
packageSchema.statics.getActivePackages = async function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
};

// Static method to get popular packages
packageSchema.statics.getPopularPackages = async function() {
  return this.find({ isActive: true, isPopular: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
};

// Static method to get package by ID (admin only)
packageSchema.statics.getPackageById = async function(id) {
  return this.findById(id).lean();
};

// Static method to create default packages (for seeding)
packageSchema.statics.createDefaultPackages = async function() {
  const defaultPackages = [
    {
      name: "Starter",
      credits: 25,
      price: 4.99,
      bonus: 5,
      description: "Perfect for casual readers",
      isPopular: false,
      isActive: true,
      sortOrder: 1
    },
    {
      name: "Pro",
      credits: 50,
      price: 9.99,
      bonus: 10,
      description: "Great for regular story enthusiasts",
      isPopular: true,
      isActive: true,
      sortOrder: 2
    },
    {
      name: "Elite",
      credits: 100,
      price: 19.99,
      bonus: 25,
      description: "For dedicated story lovers",
      isPopular: false,
      isActive: true,
      sortOrder: 3
    }
  ];

  // Check if packages already exist
  const existingCount = await this.countDocuments();
  if (existingCount > 0) {
    console.log('[PACKAGE_FLOW] Default packages already exist, skipping creation');
    return [];
  }

  const createdPackages = await this.insertMany(defaultPackages);
  console.log('[PACKAGE_FLOW] Created default packages:', createdPackages.length);
  return createdPackages;
};

// Instance method to validate package data
packageSchema.methods.validatePackage = function() {
  const errors = [];
  
  if (this.credits <= 0) {
    errors.push('Credits must be greater than 0');
  }
  
  if (this.price <= 0) {
    errors.push('Price must be greater than 0');
  }
  
  if (this.bonus < 0) {
    errors.push('Bonus cannot be negative');
  }
  
  if (this.bonus > this.credits) {
    errors.push('Bonus cannot exceed base credits');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Pre-save middleware to validate package
packageSchema.pre('save', function(next) {
  const validation = this.validatePackage();
  if (!validation.isValid) {
    const error = new Error(`Package validation failed: ${validation.errors.join(', ')}`);
    return next(error);
  }
  next();
});

export const Package = mongoose.models.Package || mongoose.model("Package", packageSchema);
