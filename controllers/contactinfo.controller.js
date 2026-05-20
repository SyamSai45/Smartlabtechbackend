import ContactInfo from '../models/ContactInfo.js';

// Helper: Compute full address string
const getFullAddresses = (addresses) => {
  return addresses.map(addr => 
    `${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}, ${addr.country || 'India'}`
  );
};

// Helper: Format response data
const formatResponse = (contactInfo) => {
  const activeAddresses = contactInfo.address.filter(addr => addr.isActive !== false);
  return {
    phones: contactInfo.phones,
    emails: contactInfo.emails,
    address: activeAddresses,
    fullAddress: getFullAddresses(activeAddresses)
  };
};

// Helper: Validate address array
const validateAddresses = (address) => {
  if (!Array.isArray(address) || address.length === 0) {
    throw new Error('Address must be a non-empty array');
  }
  for (let i = 0; i < address.length; i++) {
    const addr = address[i];
    if (!addr.street || !addr.city || !addr.state || !addr.postalCode) {
      throw new Error(`Address at index ${i} missing required fields (street, city, state, postalCode)`);
    }
  }
};

// Helper: Process address array
const processAddresses = (address) => {
  return address.map(addr => ({
    ...addr,
    country: addr.country || 'India',
    isActive: addr.isActive !== undefined ? addr.isActive : true
  }));
};

// ==================== PUBLIC ROUTES ====================

// @desc    Get active contact information (Public)
export const getContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findOne({ isActive: true });
    if (!contactInfo) {
      return res.status(404).json({ success: false, message: 'Contact info not found' });
    }
    res.json({ success: true, data: formatResponse(contactInfo) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ADMIN ROUTES ====================

// @desc    Create new contact info (Admin)
export const createContactInfo = async (req, res) => {
  try {
    const { phones, emails, address } = req.body;
    
    // Validate required fields
    if (!phones || !emails || !address) {
      return res.status(400).json({ success: false, message: 'Phones, emails, and address are required' });
    }
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ success: false, message: 'Phones must be a non-empty array' });
    }
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Emails must be a non-empty array' });
    }
    
    validateAddresses(address);
    
    // Check if contact info already exists
    if (await ContactInfo.findOne()) {
      return res.status(400).json({ success: false, message: 'Contact info already exists. Use PUT to update.' });
    }
    
    const contactInfo = await ContactInfo.create({
      phones, emails,
      address: processAddresses(address),
      isActive: true
    });
    
    res.status(201).json({ success: true, message: 'Contact info created successfully', data: formatResponse(contactInfo) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update existing contact info (Admin)
export const updateContactInfo = async (req, res) => {
  try {
    const { phones, emails, address } = req.body;
    const contactInfo = await ContactInfo.findOne();
    
    if (!contactInfo) {
      return res.status(404).json({ success: false, message: 'Contact info not found. Please create first.' });
    }
    
    if (phones && Array.isArray(phones) && phones.length > 0) contactInfo.phones = phones;
    if (emails && Array.isArray(emails) && emails.length > 0) contactInfo.emails = emails;
    
    if (address && Array.isArray(address) && address.length > 0) {
      validateAddresses(address);
      contactInfo.address = processAddresses(address);
    }
    
    await contactInfo.save();
    res.json({ success: true, message: 'Contact info updated successfully', data: formatResponse(contactInfo) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete contact info (Admin)
export const deleteContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findOne();
    if (!contactInfo) {
      return res.status(404).json({ success: false, message: 'Contact info not found' });
    }
    await ContactInfo.deleteMany({});
    res.json({ success: true, message: 'Contact info deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};