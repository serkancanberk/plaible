import { Package } from '../models/Package.js';

// Helper function for consistent error responses
const sendError = (res, statusCode, message, details = {}) => {
  console.log('[PACKAGE_FLOW] Error:', { statusCode, message, details });
  return res.status(statusCode).json({
    ok: false,
    error: message,
    ...details
  });
};

// Helper function for consistent success responses
const sendSuccess = (res, data = {}, message = 'Success') => {
  console.log('[PACKAGE_FLOW] Success:', { message, dataKeys: Object.keys(data) });
  return res.json({
    ok: true,
    message,
    ...data
  });
};

/**
 * Get all active packages (public endpoint)
 * GET /api/packages
 */
export const getPackages = async (req, res) => {
  try {
    console.log('[PACKAGE_FLOW] Getting active packages');
    
    const packages = await Package.getActivePackages();
    
    // Normalize numeric fields to ensure they are numbers
    const safe = packages.map(p => ({
      ...p,
      credits: Number(p.credits) || 0,
      bonus: Number(p.bonus) || 0,
      price: Number(p.price) || 0,
      totalCredits: (Number(p.credits) || 0) + (Number(p.bonus) || 0),
      pricePerCredit: (() => {
        const price = Number(p.price) || 0;
        const total = (Number(p.credits) || 0) + (Number(p.bonus) || 0);
        return total > 0 && isFinite(price) ? price / total : null;
      })()
    }));
    
    console.log('[PACKAGE_FLOW] Found packages:', packages.length);
    
    // Set cache headers
    res.set({
      'Cache-Control': 'no-store, private',
      'Content-Type': 'application/json'
    });
    
    return sendSuccess(res, { packages: safe }, 'Packages retrieved successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error getting packages:', error);
    return sendError(res, 500, 'Failed to retrieve packages', { 
      error: error.message 
    });
  }
};

/**
 * Get popular packages (public endpoint)
 * GET /api/packages/popular
 */
export const getPopularPackages = async (req, res) => {
  try {
    console.log('[PACKAGE_FLOW] Getting popular packages');
    
    const packages = await Package.getPopularPackages();
    
    console.log('[PACKAGE_FLOW] Found popular packages:', packages.length);
    
    res.set({
      'Cache-Control': 'no-store, private',
      'Content-Type': 'application/json'
    });
    
    return sendSuccess(res, { packages }, 'Popular packages retrieved successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error getting popular packages:', error);
    return sendError(res, 500, 'Failed to retrieve popular packages', { 
      error: error.message 
    });
  }
};

/**
 * Create a new package (admin only)
 * POST /api/packages
 */
export const createPackage = async (req, res) => {
  try {
    console.log('[PACKAGE_FLOW] Creating new package:', req.body);
    
    const { name, credits, price, bonus = 0, description, isPopular = false, sortOrder = 0 } = req.body;
    
    // Validate required fields
    if (!name || !credits || !price) {
      return sendError(res, 400, 'Missing required fields', {
        required: ['name', 'credits', 'price']
      });
    }
    
    // Validate data types and ranges
    if (typeof credits !== 'number' || credits <= 0) {
      return sendError(res, 400, 'Credits must be a positive number');
    }
    
    if (typeof price !== 'number' || price <= 0) {
      return sendError(res, 400, 'Price must be a positive number');
    }
    
    if (bonus < 0) {
      return sendError(res, 400, 'Bonus cannot be negative');
    }
    
    // Check if package name already exists
    const existingPackage = await Package.findOne({ name: name.trim() });
    if (existingPackage) {
      return sendError(res, 409, 'Package with this name already exists');
    }
    
    // Create new package
    const newPackage = new Package({
      name: name.trim(),
      credits,
      price,
      bonus,
      description: description?.trim(),
      isPopular,
      sortOrder
    });
    
    // Validate package before saving
    const validation = newPackage.validatePackage();
    if (!validation.isValid) {
      return sendError(res, 400, 'Package validation failed', {
        errors: validation.errors
      });
    }
    
    const savedPackage = await newPackage.save();
    
    console.log('[PACKAGE_FLOW] Package created successfully:', savedPackage._id);
    
    return sendSuccess(res, { package: savedPackage }, 'Package created successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error creating package:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation error', {
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    return sendError(res, 500, 'Failed to create package', { 
      error: error.message 
    });
  }
};

/**
 * Update a package (admin only)
 * PATCH /api/packages/:id
 */
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('[PACKAGE_FLOW] Updating package:', { id, updateData });
    
    // Validate package ID
    if (!id || id.length !== 24) {
      return sendError(res, 400, 'Invalid package ID');
    }
    
    // Find existing package
    const existingPackage = await Package.findById(id);
    if (!existingPackage) {
      return sendError(res, 404, 'Package not found');
    }
    
    // Validate update data
    if (updateData.credits !== undefined && (typeof updateData.credits !== 'number' || updateData.credits <= 0)) {
      return sendError(res, 400, 'Credits must be a positive number');
    }
    
    if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price <= 0)) {
      return sendError(res, 400, 'Price must be a positive number');
    }
    
    if (updateData.bonus !== undefined && updateData.bonus < 0) {
      return sendError(res, 400, 'Bonus cannot be negative');
    }
    
    // Check for name conflicts (if name is being updated)
    if (updateData.name && updateData.name !== existingPackage.name) {
      const nameConflict = await Package.findOne({ 
        name: updateData.name.trim(), 
        _id: { $ne: id } 
      });
      if (nameConflict) {
        return sendError(res, 409, 'Package with this name already exists');
      }
    }
    
    // Update package
    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        name: updateData.name?.trim(),
        description: updateData.description?.trim()
      },
      { new: true, runValidators: true }
    );
    
    console.log('[PACKAGE_FLOW] Package updated successfully:', updatedPackage._id);
    
    return sendSuccess(res, { package: updatedPackage }, 'Package updated successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error updating package:', error);
    
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation error', {
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    return sendError(res, 500, 'Failed to update package', { 
      error: error.message 
    });
  }
};

/**
 * Delete a package (admin only)
 * DELETE /api/packages/:id
 */
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[PACKAGE_FLOW] Deleting package:', id);
    
    // Validate package ID
    if (!id || id.length !== 24) {
      return sendError(res, 400, 'Invalid package ID');
    }
    
    // Find and delete package
    const deletedPackage = await Package.findByIdAndDelete(id);
    if (!deletedPackage) {
      return sendError(res, 404, 'Package not found');
    }
    
    console.log('[PACKAGE_FLOW] Package deleted successfully:', deletedPackage._id);
    
    return sendSuccess(res, { package: deletedPackage }, 'Package deleted successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error deleting package:', error);
    return sendError(res, 500, 'Failed to delete package', { 
      error: error.message 
    });
  }
};

/**
 * Get package by ID (admin only)
 * GET /api/packages/:id
 */
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[PACKAGE_FLOW] Getting package by ID:', id);
    
    // Validate package ID
    if (!id || id.length !== 24) {
      return sendError(res, 400, 'Invalid package ID');
    }
    
    const packageData = await Package.getPackageById(id);
    if (!packageData) {
      return sendError(res, 404, 'Package not found');
    }
    
    console.log('[PACKAGE_FLOW] Package found:', packageData.name);
    
    return sendSuccess(res, { package: packageData }, 'Package retrieved successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error getting package by ID:', error);
    return sendError(res, 500, 'Failed to retrieve package', { 
      error: error.message 
    });
  }
};

/**
 * Get all packages (admin only)
 * GET /api/packages/admin
 */
export const getAllPackages = async (req, res) => {
  try {
    console.log('[PACKAGE_FIX] Admin route triggered correctly - getting all packages');
    console.log('[PACKAGE_FLOW] Getting all packages (admin)');
    
    const packages = await Package.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    
    // Normalize numeric fields to ensure they are numbers
    const safe = packages.map(p => ({
      ...p,
      credits: Number(p.credits) || 0,
      bonus: Number(p.bonus) || 0,
      price: Number(p.price) || 0,
      totalCredits: (Number(p.credits) || 0) + (Number(p.bonus) || 0),
      pricePerCredit: (() => {
        const price = Number(p.price) || 0;
        const total = (Number(p.credits) || 0) + (Number(p.bonus) || 0);
        return total > 0 && isFinite(price) ? price / total : null;
      })()
    }));
    
    console.log('[PACKAGE_FLOW] Found all packages:', packages.length);
    console.log('[PACKAGE_FIX][ADMIN_GET] count=%d sample=%o', safe.length, {
      price: safe[0]?.price,
      totalCredits: safe[0]?.totalCredits,
      pricePerCredit: safe[0]?.pricePerCredit,
    });
    
    return sendSuccess(res, { packages: safe }, 'All packages retrieved successfully');
  } catch (error) {
    console.error('[PACKAGE_FLOW] Error getting all packages:', error);
    return sendError(res, 500, 'Failed to retrieve packages', { 
      error: error.message 
    });
  }
};
