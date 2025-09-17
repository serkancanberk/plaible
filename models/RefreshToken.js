import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
refreshTokenSchema.index({ userId: 1, userEmail: 1 });
refreshTokenSchema.index({ token: 1, expiresAt: 1 });

// Static method to create a new refresh token
refreshTokenSchema.statics.createToken = async function(userId, userEmail, userAgent = '', ipAddress = '') {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const refreshToken = new this({
    token,
    userId,
    userEmail,
    expiresAt,
    userAgent,
    ipAddress
  });
  
  await refreshToken.save();
  return refreshToken;
};

// Static method to find and validate a refresh token
refreshTokenSchema.statics.findAndValidate = async function(token) {
  const refreshToken = await this.findOne({ 
    token,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
  
  if (!refreshToken) {
    return null;
  }
  
  // Update last used timestamp
  refreshToken.lastUsedAt = new Date();
  await refreshToken.save();
  
  return refreshToken;
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  return await this.deleteMany({ userId });
};

// Static method to revoke a specific token
refreshTokenSchema.statics.revokeToken = async function(token) {
  return await this.deleteOne({ token });
};

// Static method to cleanup expired tokens
refreshTokenSchema.statics.cleanupExpired = async function() {
  return await this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
