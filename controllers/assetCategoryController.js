import AssetCategory from '../models/AssetCategory.js';

// Get all asset categories
export const getAllAssetCategories = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const categories = await AssetCategory.find(filter)
      .populate('createdBy', 'name email employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching asset categories',
      error: error.message
    });
  }
};

// Get asset category by ID
export const getAssetCategoryById = async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id)
      .populate('createdBy', 'name email employeeId');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Asset category not found'
      });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching asset category',
      error: error.message
    });
  }
};

// Create new asset category
export const createAssetCategory = async (req, res) => {
  try {
    const { name, description, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    // Check if category with same name or code already exists
    const existingCategory = await AssetCategory.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: code.toUpperCase() }
      ]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Asset category with this name or code already exists'
      });
    }

    const category = new AssetCategory({
      name: name.trim(),
      description: description?.trim(),
      code: code.toUpperCase().trim(),
      createdBy: req.employee._id
    });

    await category.save();

    const populatedCategory = await AssetCategory.findById(category._id)
      .populate('createdBy', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'Asset category created successfully',
      category: populatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating asset category',
      error: error.message
    });
  }
};

// Update asset category
export const updateAssetCategory = async (req, res) => {
  try {
    const { name, description, code, isActive } = req.body;
    const categoryId = req.params.id;

    const category = await AssetCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Asset category not found'
      });
    }

    // Check if another category with same name or code exists
    if (name || code) {
      const existingCategory = await AssetCategory.findOne({
        _id: { $ne: categoryId },
        $or: [
          ...(name ? [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }] : []),
          ...(code ? [{ code: code.toUpperCase() }] : [])
        ]
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Asset category with this name or code already exists'
        });
      }
    }

    // Update fields
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description?.trim();
    if (code) category.code = code.toUpperCase().trim();
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    const populatedCategory = await AssetCategory.findById(category._id)
      .populate('createdBy', 'name email employeeId');

    res.json({
      success: true,
      message: 'Asset category updated successfully',
      category: populatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating asset category',
      error: error.message
    });
  }
};

// Delete asset category
export const deleteAssetCategory = async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Asset category not found'
      });
    }

    // Check if category is being used by any assets
    const Asset = (await import('../models/Asset.js')).default;
    const assetsUsingCategory = await Asset.countDocuments({ category: req.params.id });
    
    if (assetsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${assetsUsingCategory} assets are using this category.`
      });
    }

    await AssetCategory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Asset category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting asset category',
      error: error.message
    });
  }
};

// Toggle asset category status
export const toggleAssetCategoryStatus = async (req, res) => {
  try {
    const category = await AssetCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Asset category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    const populatedCategory = await AssetCategory.findById(category._id)
      .populate('createdBy', 'name email employeeId');

    res.json({
      success: true,
      message: `Asset category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      category: populatedCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling asset category status',
      error: error.message
    });
  }
};