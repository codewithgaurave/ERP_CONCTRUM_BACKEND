import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import EmployeeFormLink from '../models/EmployeeFormLink.js';

// ─── HR: Create form ──────────────────────────────────────────────────────────
export const createFormLink = async (req, res) => {
  try {
    const { title, description, fields, headerColor, headerImage, expiresAt, responseLimit, confirmationMessage, showProgressBar, includeBaseFields } = req.body;
    const token = crypto.randomBytes(20).toString('hex');

    const formLink = new EmployeeFormLink({
      hrId: req.employee._id,
      token,
      title: title || 'Employee Application Form',
      description,
      fields: fields || [],
      headerColor,
      headerImage,
      expiresAt: expiresAt || null,
      responseLimit: responseLimit || null,
      confirmationMessage,
      showProgressBar,
      includeBaseFields
    });

    await formLink.save();
    res.status(201).json({ message: 'Form link created.', formLink });
  } catch (error) {
    res.status(500).json({ message: 'Error creating form link.', error: error.message });
  }
};

// ─── HR: Update form ──────────────────────────────────────────────────────────
export const updateFormLink = async (req, res) => {
  try {
    const formLink = await EmployeeFormLink.findOne({ _id: req.params.id, hrId: req.employee._id });
    if (!formLink) return res.status(404).json({ message: 'Form link not found.' });

    const allowed = ['title', 'description', 'fields', 'headerColor', 'headerImage', 'expiresAt', 'responseLimit', 'confirmationMessage', 'showProgressBar', 'includeBaseFields'];
    allowed.forEach(key => { if (req.body[key] !== undefined) formLink[key] = req.body[key]; });

    await formLink.save();
    res.json({ message: 'Form updated.', formLink });
  } catch (error) {
    res.status(500).json({ message: 'Error updating form.', error: error.message });
  }
};

// ─── HR: Duplicate form ───────────────────────────────────────────────────────
export const duplicateFormLink = async (req, res) => {
  try {
    const original = await EmployeeFormLink.findOne({ _id: req.params.id, hrId: req.employee._id });
    if (!original) return res.status(404).json({ message: 'Form link not found.' });

    const token = crypto.randomBytes(20).toString('hex');
    const copy = new EmployeeFormLink({
      hrId: req.employee._id,
      token,
      title: `${original.title} (Copy)`,
      description: original.description,
      fields: original.fields,
      headerColor: original.headerColor,
      headerImage: original.headerImage,
      responseLimit: original.responseLimit,
      confirmationMessage: original.confirmationMessage,
      showProgressBar: original.showProgressBar,
      includeBaseFields: original.includeBaseFields,
      submissions: []
    });

    await copy.save();
    res.status(201).json({ message: 'Form duplicated.', formLink: copy });
  } catch (error) {
    res.status(500).json({ message: 'Error duplicating form.', error: error.message });
  }
};

// ─── HR: Get all form links ───────────────────────────────────────────────────
export const getMyFormLinks = async (req, res) => {
  try {
    const formLinks = await EmployeeFormLink.find({ hrId: req.employee._id })
      .select('-submissions')
      .sort({ createdAt: -1 });
    res.json({ formLinks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form links.', error: error.message });
  }
};

// ─── HR: Get single form with submissions ─────────────────────────────────────
export const getFormLinkWithSubmissions = async (req, res) => {
  try {
    const formLink = await EmployeeFormLink.findOne({ _id: req.params.id, hrId: req.employee._id });
    if (!formLink) return res.status(404).json({ message: 'Form link not found.' });
    res.json({ formLink });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form link.', error: error.message });
  }
};

// ─── HR: Toggle active ────────────────────────────────────────────────────────
export const toggleFormLink = async (req, res) => {
  try {
    const formLink = await EmployeeFormLink.findOne({ _id: req.params.id, hrId: req.employee._id });
    if (!formLink) return res.status(404).json({ message: 'Form link not found.' });
    formLink.isActive = !formLink.isActive;
    await formLink.save();
    res.json({ message: `Form ${formLink.isActive ? 'activated' : 'deactivated'}.`, formLink });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling form link.', error: error.message });
  }
};

// ─── HR: Delete form ──────────────────────────────────────────────────────────
export const deleteFormLink = async (req, res) => {
  try {
    const formLink = await EmployeeFormLink.findOneAndDelete({ _id: req.params.id, hrId: req.employee._id });
    if (!formLink) return res.status(404).json({ message: 'Form link not found.' });
    res.json({ message: 'Form link deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form link.', error: error.message });
  }
};

// ─── HR: Update submission status ────────────────────────────────────────────
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { status } = req.body;

    const formLink = await EmployeeFormLink.findOne({ _id: id, hrId: req.employee._id });
    if (!formLink) return res.status(404).json({ message: 'Form link not found.' });

    const submission = formLink.submissions.id(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });

    submission.status = status;
    await formLink.save();
    res.json({ message: 'Status updated.', submission });
  } catch (error) {
    res.status(500).json({ message: 'Error updating submission.', error: error.message });
  }
};

// ─── PUBLIC: Get form structure ───────────────────────────────────────────────
export const getPublicForm = async (req, res) => {
  try {
    const formLink = await EmployeeFormLink.findOne({ token: req.params.token })
      .select('title description fields headerColor headerImage isActive expiresAt responseLimit confirmationMessage showProgressBar includeBaseFields submissions');

    if (!formLink) return res.status(404).json({ message: 'Form not found.' });
    if (!formLink.isActive) return res.status(400).json({ message: 'This form is no longer accepting responses.' });
    if (formLink.expiresAt && new Date() > formLink.expiresAt) {
      return res.status(400).json({ message: 'This form has expired.' });
    }
    if (formLink.responseLimit && formLink.submissions.length >= formLink.responseLimit) {
      return res.status(400).json({ message: 'This form has reached its response limit.' });
    }

    // Don't send submissions to public
    const formData = formLink.toObject();
    delete formData.submissions;
    res.json({ form: formData });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form.', error: error.message });
  }
};

// ─── PUBLIC: Submit form ──────────────────────────────────────────────────────
export const submitPublicForm = async (req, res) => {
  try {
    const formLink = await EmployeeFormLink.findOne({ token: req.params.token });

    if (!formLink) return res.status(404).json({ message: 'Form not found.' });
    if (!formLink.isActive) return res.status(400).json({ message: 'This form is no longer active.' });
    if (formLink.expiresAt && new Date() > formLink.expiresAt) {
      return res.status(400).json({ message: 'This form has expired.' });
    }
    if (formLink.responseLimit && formLink.submissions.length >= formLink.responseLimit) {
      return res.status(400).json({ message: 'This form has reached its response limit.' });
    }

    const { firstName, lastName, email, mobile, alternateMobile, whatsappNumber, gender, dob,
      street, city, state, country, pincode, answers } = req.body;

    if (!firstName || !lastName || !email || !mobile) {
      return res.status(400).json({ message: 'First name, last name, email, and mobile are required.' });
    }

    // Validate required custom fields
    for (const field of formLink.fields) {
      if (field.fieldType === 'section_break') continue;
      if (field.required) {
        const answer = answers?.[field.id];
        const isEmpty = !answer || (Array.isArray(answer) && answer.length === 0) || answer === '';
        if (isEmpty) {
          return res.status(400).json({ message: `"${field.label}" is required.` });
        }
      }
    }

    // Handle uploaded files - map fieldId to file path
    const fileAnswers = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // fieldname is the fieldId
        fileAnswers[file.fieldname] = `/uploads/form-files/${file.filename}`;
      });
    }

    const mergedAnswers = { ...(answers || {}), ...fileAnswers };

    formLink.submissions.push({
      firstName, lastName, email, mobile,
      alternateMobile, whatsappNumber, gender, dob,
      street, city, state, country, pincode,
      answers: mergedAnswers
    });

    await formLink.save();
    res.status(201).json({
      message: formLink.confirmationMessage || 'Form submitted successfully!'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting form.', error: error.message });
  }
};
