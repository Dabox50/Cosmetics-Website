const pdf = require('pdf-parse');

const verifyReceipt = async (buffer) => {
  try {
    const data = await pdf(buffer);
    const text = data.text.toLowerCase();

    // List of trusted bank keywords
    const trustedBanks = [
      'opay',
      'sterling',
      'kuda',
      'palmpay',
      'moniepoint',
      'zenith',
      'access',
      'guaranty trust',
      'gtbank',
      'first bank',
      'united bank for africa',
      'uba'
    ];

    // Check if any trusted bank name is present
    const bankFound = trustedBanks.find(bank => text.includes(bank));
    if (!bankFound) {
      return { 
        valid: false, 
        message: 'The receipt does not appear to be from a recognized bank or fintech provider.' 
      };
    }

    // Common receipt keywords that should be present
    const requiredKeywords = [
      'transaction',
      'receipt',
      'reference',
      'amount',
      'date',
      'success'
    ];

    const missingKeywords = requiredKeywords.filter(keyword => !text.includes(keyword));
    
    // Allow for some flexibility (e.g., 2 missing keywords is still okay if bank is found)
    if (missingKeywords.length > 2) {
      return { 
        valid: false, 
        message: 'The uploaded file does not contain standard transaction receipt details.' 
      };
    }

    // Try to extract a transaction reference/number
    // Pattern matches typical numeric or alphanumeric references
    const refMatch = text.match(/reference\s*(?:no|number)?[:\- ]*\s*([a-z0-9]{10,})/i) || 
                     text.match(/transaction\s*(?:id|no|number)?[:\- ]*\s*([a-z0-9]{10,})/i);

    if (!refMatch) {
       // Opay and others sometimes use "ID" or "Ref"
       const shortRefMatch = text.match(/ref[:\- ]*\s*([a-z0-9]{8,})/i) ||
                             text.match(/id[:\- ]*\s*([a-z0-9]{8,})/i);
       
       if (!shortRefMatch) {
         return { 
           valid: false, 
           message: 'Could not find a valid transaction reference number in the receipt.' 
         };
       }
    }

    return { 
      valid: true, 
      bank: bankFound,
      reference: refMatch ? refMatch[1] : 'Found'
    };

  } catch (error) {
    console.error('Receipt verification error:', error);
    return { 
      valid: false, 
      message: 'Failed to process the PDF file. Please ensure it is a valid receipt.' 
    };
  }
};

module.exports = { verifyReceipt };
