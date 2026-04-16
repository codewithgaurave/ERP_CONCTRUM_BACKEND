import mongoose from 'mongoose';

const assetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
assetCategorySchema.index({ name: 1 });
assetCategorySchema.index({ code: 1 });
assetCategorySchema.index({ isActive: 1 });

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
export default AssetCategory;