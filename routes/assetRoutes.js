import express from 'express';
import multer from 'multer';
import { authenticateToken, requireTeamLeader, requireRole } from '../middlewares/authMiddleware.js';
import {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  getAssetsByEmployee,
  getAssetCategories,
  getHRTeamAssets,
  assignAssetToHRTeam,
  getHRTeamEmployeesForAssets,
  getTeamLeaderAssets,
  transferAsset,
  getAssetHistory,
  getMyAssetHistory,
  getAllAssetsHistory,
  employeeTransferAsset,
  getMyTransferableAssets,
  getColleaguesForTransfer,
  generateSampleExcel,
  importAssetsFromExcel,
  exportAssetsToExcel
} from '../controllers/assetController.js';

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/excel/');
  },
  filename: (req, file, cb) => {
    cb(null, `assets_import_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Excel routes (HR Manager only)
router.get('/excel/sample', requireRole(['HR_Manager']), generateSampleExcel);
router.post('/excel/import', requireRole(['HR_Manager']), upload.single('file'), importAssetsFromExcel);
router.get('/excel/export', requireRole(['HR_Manager']), exportAssetsToExcel);

// Asset CRUD routes
router.post('/', createAsset);

// History routes (MUST come before /:id routes)
router.get('/history/all', getAllAssetsHistory); // HR Panel - All assets history
router.get('/history/my', getMyAssetHistory); // Employee Panel - My asset history

// Employee Transfer Routes (MUST come before /:id routes)
router.get('/my/transferable', getMyTransferableAssets); // Employee - My assets that I can transfer
router.get('/colleagues/transfer', getColleaguesForTransfer); // Employee - Get colleagues list

// HR Team specific routes (must come before general routes)
router.get('/team/hr', getHRTeamAssets);
router.get('/team/employees', getHRTeamEmployeesForAssets);
router.post('/:id/assign/team', assignAssetToHRTeam);

// Team Leader specific route
router.get('/team/leader', requireTeamLeader, getTeamLeaderAssets);

// Categories route
router.get('/categories', getAssetCategories);

// Employee assets
router.get('/employee/:employeeId', getAssetsByEmployee);

// General routes
router.get('/', getAllAssets);
router.get('/:id', getAssetById);
router.get('/:id/history', getAssetHistory); // Specific asset history
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

// Asset assignment routes
router.post('/:id/assign', assignAsset);
router.post('/:id/return', returnAsset);
router.post('/:id/transfer', transferAsset); // HR/Team Leader transfer
router.post('/:id/employee-transfer', employeeTransferAsset); // Employee-to-Employee transfer/share

export default router;