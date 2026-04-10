

import mongoose from "mongoose";

const taskHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["New", "Assigned", "In Progress", "Pending", "Completed", "Approved", "Rejected"],
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true,
    required: true
  }
});

// Dynamic form field schema for task forms
const taskFormFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true, trim: true },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'email', 'date', 'time', 'textarea', 'select', 'radio', 'checkbox', 'file', 'rating', 'linear_scale'],
    default: 'text'
  },
  placeholder: { type: String, trim: true },
  options: [String],
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  scaleMin: { type: Number, default: 1 },
  scaleMax: { type: Number, default: 5 },
  scaleMinLabel: { type: String },
  scaleMaxLabel: { type: String },
  allowedFileTypes: [String],
  maxFileSizeMB: { type: Number, default: 5 }
}, { _id: false });

// Task response schema for individual submissions
const taskResponseSchema = new mongoose.Schema({
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  responses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ["Submitted", "Approved", "Rejected", "Needs Review"],
    default: "Submitted"
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee"
  },
  reviewRemarks: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    taskType: {
      type: String,
      enum: ["Survey", "Machine Installation", "Data Collection", "Inspection", "Training", "Custom"],
      default: "Custom"
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    // For bulk tasks - target count and current progress
    targetCount: {
      type: Number,
      default: 1
    },
    currentCount: {
      type: Number,
      default: 0
    },
    // Dynamic form fields for this task
    formFields: [taskFormFieldSchema],
    // All responses/submissions for this task
    responses: [taskResponseSchema],
    status: {
      type: String,
      enum: ["New", "Assigned", "In Progress", "Pending", "Completed", "Approved", "Rejected"],
      default: "New"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium"
    },
    dueDate: {
      type: Date
    },
    deadline: {
      type: Date,
      required: true
    },
    statusRemarks: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Parent task reference for sub-tasks
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    },
    // Sub-tasks created from this task
    subTasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    }],
    taskHistory: [taskHistorySchema]
  },
  {
    timestamps: true
  }
);

// Enhanced middleware to automatically log ALL changes
taskSchema.pre("save", async function (next) {
  if (this.isNew) {
    // For new task, initial history entry
    this.taskHistory.push({
      status: "New",
      updatedBy: this.assignedBy,
      remarks: "Task created",
      updatedAt: new Date()
    });
  } else {
    const statusChanged = this.isModified("status");
    const otherFieldsChanged = this.isModified(["title", "description", "assignedTo", "priority", "dueDate", "deadline", "currentCount"]);
    
    if (statusChanged || otherFieldsChanged) {
      const historyEntry = {
        status: this.status,
        updatedBy: this.assignedTo,
        updatedAt: new Date(),
        remarks: this.statusRemarks || `Status changed to ${this.status}`
      };

      if (otherFieldsChanged && !statusChanged) {
        const modifiedFields = [];
        
        if (this.isModified("title")) modifiedFields.push("title");
        if (this.isModified("description")) modifiedFields.push("description");
        if (this.isModified("assignedTo")) modifiedFields.push("assignedTo");
        if (this.isModified("priority")) modifiedFields.push("priority");
        if (this.isModified("dueDate")) modifiedFields.push("dueDate");
        if (this.isModified("deadline")) modifiedFields.push("deadline");
        if (this.isModified("currentCount")) modifiedFields.push("progress updated");
        
        historyEntry.remarks = `Updated fields: ${modifiedFields.join(", ")}`;
      }

      this.taskHistory.push(historyEntry);
    }
  }
  next();
});

// Virtual for completion percentage
taskSchema.virtual('completionPercentage').get(function() {
  if (this.targetCount === 0) return 0;
  return Math.round((this.currentCount / this.targetCount) * 100);
});

// Virtual for deadline status
taskSchema.virtual('deadlineStatus').get(function() {
  if (this.status === 'Completed' || this.status === 'Approved') {
    return 'completed';
  }
  if (this.deadline && new Date() > this.deadline) {
    return 'overdue';
  }
  if (this.deadline) {
    const timeDiff = this.deadline.getTime() - new Date().getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (daysDiff <= 1) return 'urgent';
    if (daysDiff <= 3) return 'approaching';
  }
  return 'normal';
});

// Index for better query performance
taskSchema.index({ deadline: 1 });
taskSchema.index({ status: 1, deadline: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ taskType: 1 });
taskSchema.index({ parentTask: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;