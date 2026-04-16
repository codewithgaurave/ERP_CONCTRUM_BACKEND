import express from 'express';
import {
  getAllAssetCategories,
  getAssetCategoryById,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
  toggleAssetCategoryStatus
} from '../controllers/assetCategoryController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get all asset categories
router.get('/', authenticateToken, getAllAssetCategories);

// Get asset category by ID
router.get('/:id', authenticateToken, getAssetCategoryById);

// Create new asset category (HR Manager only)
router.post('/', authenticateToken, requireRole(['HR_Manager']), createAssetCategory);

// Update asset category (HR Manager only)
router.put('/:id', authenticateToken, requireRole(['HR_Manager']), updateAssetCategory);

// Toggle asset category status (HR Manager only)
router.patch('/:id/toggle', authenticateToken, requireRole(['HR_Manager']), toggleAssetCategoryStatus);

// Delete asset category (HR Manager only)
router.delete('/:id', authenticateToken, requireRole(['HR_Manager']), deleteAssetCategory);

export default router;