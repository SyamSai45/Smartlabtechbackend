import ContactInfo from '../models/ContactInfo.js';

// ==================== GET CONTACT INFO (PUBLIC) ====================

// @desc    Get active contact information (Public)
// @route   GET /api/contact-info
export const getContactInfo = async (req, res) => {
  try {
    let contactInfo = await ContactInfo.findOne({ isActive: true });
    
    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: 'Contact info not found'
      });
    }

    // Filter only active addresses
    const activeAddresses = contactInfo.address.filter(addr => addr.isActive !== false);

    // Compute full address strings
    const fullAddresses = activeAddresses.map(addr => 
      `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country}`
    );

    res.json({
      success: true,
      data: {
        phones: contactInfo.phones,
        emails: contactInfo.emails,
        address: activeAddresses,
        fullAddress: fullAddresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE CONTACT INFO (ADMIN) ====================

// @desc    Create new contact info (Admin)
// @route   POST /api/contact-info
export const createContactInfo = async (req, res) => {
  try {
    const { phones, emails, address } = req.body;

    // Validate required fields
    if (!phones || !emails || !address) {
      return res.status(400).json({
        success: false,
        message: 'Phones, emails, and address are required'
      });
    }

    // Validate phones array
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phones must be a non-empty array'
      });
    }

    // Validate emails array
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Emails must be a non-empty array'
      });
    }

    // Validate address array
    if (!Array.isArray(address) || address.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Address must be a non-empty array'
      });
    }

    // Validate each address has required fields
    for (let i = 0; i < address.length; i++) {
      const addr = address[i];
      if (!addr.street || !addr.city || !addr.state || !addr.postalCode) {
        return res.status(400).json({
          success: false,
          message: `Address at index ${i} missing required fields (street, city, state, postalCode)`
        });
      }
    }

    // Check if contact info already exists
    const existingContactInfo = await ContactInfo.findOne();
    if (existingContactInfo) {
      return res.status(400).json({
        success: false,
        message: 'Contact info already exists. Use PUT to update or DELETE to remove first.'
      });
    }
    
    // Create new contact info
    const contactInfo = await ContactInfo.create({
      phones,
      emails,
      address: address.map(addr => ({
        ...addr,
        country: addr.country || 'India',
        isActive: true
      })),
      isActive: true
    });

    // Compute full address strings for response
    const fullAddresses = contactInfo.address.map(addr => 
      `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country}`
    );

    res.status(201).json({
      success: true,
      message: 'Contact info created successfully',
      data: {
        phones: contactInfo.phones,
        emails: contactInfo.emails,
        address: contactInfo.address,
        fullAddress: fullAddresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE CONTACT INFO (ADMIN) ====================

// @desc    Update existing contact info (Admin)
// @route   PUT /api/contact-info
export const updateContactInfo = async (req, res) => {
  try {
    const { phones, emails, address } = req.body;

    let contactInfo = await ContactInfo.findOne();
    
    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: 'Contact info not found. Please create first using POST.'
      });
    }

    // Update fields if provided
    if (phones && Array.isArray(phones) && phones.length > 0) {
      contactInfo.phones = phones;
    }
    
    if (emails && Array.isArray(emails) && emails.length > 0) {
      contactInfo.emails = emails;
    }
    
    if (address && Array.isArray(address) && address.length > 0) {
      // Validate each address
      for (let i = 0; i < address.length; i++) {
        const addr = address[i];
        if (!addr.street || !addr.city || !addr.state || !addr.postalCode) {
          return res.status(400).json({
            success: false,
            message: `Address at index ${i} missing required fields (street, city, state, postalCode)`
          });
        }
      }
      contactInfo.address = address.map(addr => ({
        ...addr,
        country: addr.country || 'India',
        isActive: addr.isActive !== undefined ? addr.isActive : true
      }));
    }
    
    await contactInfo.save();

    // Compute full address strings for response
    const fullAddresses = contactInfo.address.map(addr => 
      `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country}`
    );

    res.json({
      success: true,
      message: 'Contact info updated successfully',
      data: {
        phones: contactInfo.phones,
        emails: contactInfo.emails,
        address: contactInfo.address,
        fullAddress: fullAddresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE CONTACT INFO (ADMIN) ====================

// @desc    Delete contact info (Admin)
// @route   DELETE /api/contact-info
export const deleteContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findOne();
    
    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: 'Contact info not found'
      });
    }

    await ContactInfo.deleteMany({});

    res.json({
      success: true,
      message: 'Contact info deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};