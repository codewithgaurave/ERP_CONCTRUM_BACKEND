import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true }, // client-side unique id for ordering
  label: { type: String, required: true, trim: true },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'email', 'date', 'time', 'textarea', 'select', 'radio', 'checkbox', 'file', 'rating', 'linear_scale', 'section_break'],
    default: 'text'
  },
  placeholder: { type: String, trim: true },
  options: [String],           // for select, radio, checkbox
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  // For linear_scale
  scaleMin: { type: Number, default: 1 },
  scaleMax: { type: Number, default: 5 },
  scaleMinLabel: { type: String },
  scaleMaxLabel: { type: String },
  // For section_break
  sectionTitle: { type: String },
  sectionDescription: { type: String },
  // For file
  allowedFileTypes: [String], // e.g. ['pdf', 'doc', 'jpg']
  maxFileSizeMB: { type: Number, default: 5 }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  // Fixed base fields
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: String, required: true, trim: true },
  alternateMobile: { type: String, trim: true },
  whatsappNumber: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''] },
  dob: { type: Date },
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true, default: 'India' },
  pincode: { type: String, trim: true },

  // Bank Details
  bankName: { type: String, trim: true },
  accountNumber: { type: String, trim: true },
  ifscCode: { type: String, trim: true },
  accountHolderName: { type: String, trim: true },
  branchName: { type: String, trim: true },

  // Dynamic answers: { fieldId: value }
  // value can be string, array (checkbox), or file path
  answers: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  convertedToEmployee: { type: Boolean, default: false },
  convertedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  submittedAt: { type: Date, default: Date.now }
});

const employeeFormLinkSchema = new mongoose.Schema({
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  token: { type: String, required: true, unique: true },

  // Form meta
  title: { type: String, required: true, trim: true, default: 'Employee Application Form' },
  description: { type: String, trim: true },
  headerColor: { type: String, default: '#4F46E5' }, // customizable header color
  headerImage: { type: String, trim: true }, // URL for header image

  // Fields (includes section_break type for sections)
  fields: [fieldSchema],

  // Settings
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  responseLimit: { type: Number, default: null }, // null = unlimited
  confirmationMessage: { type: String, default: 'Your response has been recorded. Thank you!' },
  showProgressBar: { type: Boolean, default: true },
  shuffleFields: { type: Boolean, default: false },

  // Include/exclude default base fields
  includeBaseFields: {
    personalInfo: { type: Boolean, default: true },
    address: { type: Boolean, default: true },
    bankDetails: { type: Boolean, default: false }
  },

  submissions: [submissionSchema]
}, { timestamps: true });

export default mongoose.model('EmployeeFormLink', employeeFormLinkSchema);
