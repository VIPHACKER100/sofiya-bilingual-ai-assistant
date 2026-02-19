// Security protocols for JARVIS
// Implements sanitization and threat detection

export const SecurityService = {
  /**
   * Sanitizes command input to prevent potential XSS or injection vectors
   * @param command Raw command string
   * @returns Sanitized string
   */
  sanitizeCommand: (command: string): string => {
    if (!command) return "";
    return command
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove protocol handlers
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Analyzes command for potential social engineering or phishing keywords
   * @param command Sanitized command string
   * @returns boolean - true if threat detected
   */
  analyzeForPhishing: (command: string): boolean => {
    const phishingKeywords = [
      'password', 'credit card', 'otp', 'bank details', 'cvv', 'pin',
      'पासवर्ड', 'क्रेडिट कार्ड', 'ओटीपी', 'बैंक डिटेल', 'पिन'
    ];
    
    const lowerCmd = command.toLowerCase();
    return phishingKeywords.some(kw => lowerCmd.includes(kw));
  },

  /**
   * Validates WhatsApp number format for Indian region (+91)
   * @param number Phone number string
   * @returns boolean
   */
  validateWhatsAppNumber: (number: string): boolean => {
    // Expecting format like 919876543210
    const phonePattern = /^91[6-9]\d{9}$/;
    return phonePattern.test(number);
  }
};