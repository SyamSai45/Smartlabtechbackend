import { Subject, Contact } from '../models/Contact.js';

// ==================== SUBJECT MANAGEMENT ====================

// @desc    Create new contact subject
// @route   POST /api/contact/subjects
export const createSubject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingSubject = await Subject.findOne({ name });
    if (existingSubject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject already exists' 
      });
    }

    const subject = await Subject.create({
      name,
      description: description || '',
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      message: 'Subject created successfully', 
      data: subject 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subjects (Admin)
// @route   GET /api/contact/subjects
export const getAllSubjects = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subjects = await Subject.find(query)
      .sort({ name: 1 });

    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active subjects for dropdown (Public)
// @route   GET /api/contact/subjects/active
export const getActiveSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 });

    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/contact/subjects/:id
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/contact/subjects/:id
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    console.log('🔍 Updating subject ID:', id);
    console.log('📝 Update data:', { name, description, isActive });

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields provided for update' 
      });
    }

    // Check if subject exists
    const subject = await Subject.findById(id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    // Check if name already exists (if name is being updated)
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({ 
        name: name, 
        _id: { $ne: id } 
      });
      if (existingSubject) {
        return res.status(400).json({ 
          success: false, 
          message: 'Subject name already exists' 
        });
      }
    }

    // Update the document
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,           // Return updated document
        runValidators: true  // Run validators
      }
    );

    console.log('✅ Updated subject:', updatedSubject);

    res.json({ 
      success: true, 
      message: 'Subject updated successfully', 
      data: updatedSubject 
    });
  } catch (error) {
    console.error('Update subject error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject name already exists' 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/contact/subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Subject deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle subject active status
// @route   PATCH /api/contact/subjects/:id/toggle
export const toggleSubjectStatus = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    subject.isActive = !subject.isActive;
    await subject.save();

    res.json({ 
      success: true, 
      message: `Subject ${subject.isActive ? 'activated' : 'deactivated'} successfully`,
      data: subject 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CONTACT FORM MANAGEMENT ====================

// @desc    Submit contact form (Public)
// @route   POST /api/contact/submit
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Verify subject exists and is active
    const subjectDoc = await Subject.findOne({ 
      _id: subject, 
      isActive: true 
    });
    
    if (!subjectDoc) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or inactive subject selected' 
      });
    }

    // Create new contact entry
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject: subjectDoc._id,
      message,
      status: 'pending'
    });

    // Populate subject details for response
    await contact.populate('subject', 'name description');

    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully', 
      data: contact 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all contact submissions (Admin only)
// @route   GET /api/contact/all
export const getAllContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      subject,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (subject) query.subject = subject;
    
    if (search) {
      query.$text = { $search: search };
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .populate('subject', 'name description')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single contact submission by ID
// @route   GET /api/contact/:id
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('subject', 'name description');
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact submission not found' 
      });
    }

    // Mark as read if it was pending
    if (contact.status === 'pending') {
      contact.status = 'read';
      await contact.save();
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update contact submission status
// @route   PUT /api/contact/:id/status
export const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['pending', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('subject', 'name description');

    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact submission not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Status updated successfully', 
      data: contact 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact submission
// @route   DELETE /api/contact/:id
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: 'Contact submission not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Contact submission deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get contact statistics (Admin only)
// @route   GET /api/contact/stats
export const getContactStats = async (req, res) => {
  try {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const read = await Contact.countDocuments({ status: 'read' });
    const replied = await Contact.countDocuments({ status: 'replied' });
    const archived = await Contact.countDocuments({ status: 'archived' });

    // Get counts by subject
    const subjectStats = await Contact.aggregate([
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subjectInfo' } },
      { $unwind: '$subjectInfo' },
      { $group: { _id: '$subjectInfo.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent submissions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = await Contact.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get total subjects count
    const totalSubjects = await Subject.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        total,
        pending,
        read,
        replied,
        archived,
        recent,
        totalSubjects,
        bySubject: subjectStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};