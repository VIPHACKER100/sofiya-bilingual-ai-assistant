/**
 * SOFIYA Document Scanner
 * Phase 19.4: Extract Information from Photos of Documents
 * 
 * OCR on receipts, invoices, IDs, QR codes, and whiteboards.
 * Auto-creates expense records and extracts structured data.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class DocumentScanner {
    constructor(options = {}) {
        this.db = options.db || null;
        this.ocrService = options.ocrService || 'google'; // google, tesseract
        this.enableExpenseTracking = options.enableExpenseTracking !== false;
    }

    /**
     * Scans receipt and extracts expense data
     * @param {Buffer} imageData - Receipt image
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Extracted receipt data
     */
    async scanReceipt(imageData, userId) {
        console.log('[DocumentScanner] Scanning receipt...');

        // Perform OCR
        const ocrText = await this.performOCR(imageData);

        // Extract receipt data
        const receiptData = this.extractReceiptData(ocrText);

        // Auto-create expense record if enabled
        if (this.enableExpenseTracking && receiptData.amount) {
            await this.createExpenseRecord(userId, receiptData);
        }

        return {
            type: 'receipt',
            ...receiptData,
            rawText: ocrText,
            scannedAt: new Date().toISOString()
        };
    }

    /**
     * Scans invoice and extracts information
     * @param {Buffer} imageData - Invoice image
     * @returns {Promise<Object>} Extracted invoice data
     */
    async scanInvoice(imageData) {
        console.log('[DocumentScanner] Scanning invoice...');

        const ocrText = await this.performOCR(imageData);
        const invoiceData = this.extractInvoiceData(ocrText);

        return {
            type: 'invoice',
            ...invoiceData,
            rawText: ocrText,
            scannedAt: new Date().toISOString()
        };
    }

    /**
     * Scans ID card and extracts contact info (optional)
     * @param {Buffer} imageData - ID card image
     * @returns {Promise<Object>} Extracted contact data
     */
    async scanID(imageData) {
        console.log('[DocumentScanner] Scanning ID card...');

        const ocrText = await this.performOCR(imageData);
        const contactData = this.extractContactData(ocrText);

        return {
            type: 'id',
            ...contactData,
            rawText: ocrText.substring(0, 100), // Only store snippet for privacy
            scannedAt: new Date().toISOString()
        };
    }

    /**
     * Scans QR code
     * @param {Buffer} imageData - Image containing QR code
     * @returns {Promise<Object>} QR code data
     */
    async scanQRCode(imageData) {
        console.log('[DocumentScanner] Scanning QR code...');

        // In production, use QR code library:
        // const qr = require('qrcode-reader');
        // const qrData = await qr.decode(imageData);

        // Simulate QR code detection
        const qrData = {
            type: 'url',
            data: 'https://example.com',
            format: 'QR_CODE'
        };

        return {
            type: 'qr_code',
            ...qrData,
            scannedAt: new Date().toISOString()
        };
    }

    /**
     * Scans whiteboard/notes and extracts text
     * @param {Buffer} imageData - Whiteboard/note image
     * @returns {Promise<Object>} Extracted text
     */
    async scanWhiteboard(imageData) {
        console.log('[DocumentScanner] Scanning whiteboard...');

        const ocrText = await this.performOCR(imageData);
        
        // Extract structured notes (bullets, lists, etc.)
        const structuredNotes = this.extractStructuredNotes(ocrText);

        return {
            type: 'whiteboard',
            text: ocrText,
            structured: structuredNotes,
            scannedAt: new Date().toISOString()
        };
    }

    /**
     * Performs OCR on image
     * @private
     */
    async performOCR(imageData) {
        // In production, use Google Cloud Vision API:
        // const vision = require('@google-cloud/vision');
        // const client = new vision.ImageAnnotatorClient();
        // const [result] = await client.textDetection({ image: { content: imageData } });
        // return result.textAnnotations[0].description;

        // For now, return placeholder
        return 'Simulated OCR text from image';
    }

    /**
     * Extracts receipt data from OCR text
     * @private
     */
    extractReceiptData(ocrText) {
        const data = {
            merchant: null,
            date: null,
            amount: null,
            items: [],
            tax: null,
            total: null
        };

        // Extract merchant name (usually at top)
        const merchantMatch = ocrText.match(/^([A-Z][A-Z\s&]+)/m);
        if (merchantMatch) {
            data.merchant = merchantMatch[1].trim();
        }

        // Extract date
        const dateMatch = ocrText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
        if (dateMatch) {
            data.date = dateMatch[1];
        }

        // Extract total amount (usually largest number with $ or currency symbol)
        const amountMatches = ocrText.match(/\$?(\d+\.\d{2})\b/g);
        if (amountMatches && amountMatches.length > 0) {
            const amounts = amountMatches.map(m => parseFloat(m.replace('$', '')));
            data.total = Math.max(...amounts);
            
            // Second largest might be subtotal
            if (amounts.length > 1) {
                amounts.sort((a, b) => b - a);
                data.amount = amounts[1]; // Subtotal
                data.tax = data.total - data.amount;
            } else {
                data.amount = data.total;
            }
        }

        // Extract line items (lines with prices)
        const lines = ocrText.split('\n');
        lines.forEach(line => {
            const itemMatch = line.match(/^(.+?)\s+\$?(\d+\.\d{2})$/);
            if (itemMatch && !itemMatch[1].toLowerCase().includes('total') && 
                !itemMatch[1].toLowerCase().includes('tax')) {
                data.items.push({
                    name: itemMatch[1].trim(),
                    price: parseFloat(itemMatch[2])
                });
            }
        });

        return data;
    }

    /**
     * Extracts invoice data from OCR text
     * @private
     */
    extractInvoiceData(ocrText) {
        const data = {
            invoiceNumber: null,
            vendor: null,
            date: null,
            dueDate: null,
            amount: null,
            lineItems: []
        };

        // Extract invoice number
        const invoiceMatch = ocrText.match(/invoice\s*#?:?\s*([A-Z0-9\-]+)/i);
        if (invoiceMatch) {
            data.invoiceNumber = invoiceMatch[1];
        }

        // Extract vendor
        const vendorMatch = ocrText.match(/^([A-Z][A-Z\s&]+)/m);
        if (vendorMatch) {
            data.vendor = vendorMatch[1].trim();
        }

        // Extract dates
        const dateMatches = ocrText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g);
        if (dateMatches && dateMatches.length >= 1) {
            data.date = dateMatches[0];
        }
        if (dateMatches && dateMatches.length >= 2) {
            data.dueDate = dateMatches[1];
        }

        // Extract amount
        const amountMatch = ocrText.match(/total[:\s]+\$?(\d+\.\d{2})/i);
        if (amountMatch) {
            data.amount = parseFloat(amountMatch[1]);
        }

        return data;
    }

    /**
     * Extracts contact data from ID
     * @private
     */
    extractContactData(ocrText) {
        const data = {
            name: null,
            phone: null,
            email: null,
            address: null
        };

        // Extract name (usually first line or after "Name:")
        const nameMatch = ocrText.match(/(?:name|full name)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
        if (nameMatch) {
            data.name = nameMatch[1];
        }

        // Extract phone
        const phoneMatch = ocrText.match(/(\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/);
        if (phoneMatch) {
            data.phone = phoneMatch[0];
        }

        // Extract email
        const emailMatch = ocrText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
            data.email = emailMatch[0];
        }

        return data;
    }

    /**
     * Extracts structured notes from whiteboard text
     * @private
     */
    extractStructuredNotes(ocrText) {
        const lines = ocrText.split('\n').filter(line => line.trim().length > 0);
        const structured = {
            bullets: [],
            numbered: [],
            headings: [],
            plain: []
        };

        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Bullet points
            if (trimmed.match(/^[•\-\*]\s+/)) {
                structured.bullets.push(trimmed.replace(/^[•\-\*]\s+/, ''));
            }
            // Numbered list
            else if (trimmed.match(/^\d+\.\s+/)) {
                structured.numbered.push(trimmed.replace(/^\d+\.\s+/, ''));
            }
            // Headings (all caps or short lines)
            else if (trimmed.length < 50 && trimmed === trimmed.toUpperCase()) {
                structured.headings.push(trimmed);
            }
            // Plain text
            else {
                structured.plain.push(trimmed);
            }
        });

        return structured;
    }

    /**
     * Creates expense record from receipt
     * @private
     */
    async createExpenseRecord(userId, receiptData) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO expenses (user_id, merchant, amount, date, category, items, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id
            `;

            const result = await this.db.query(query, [
                userId,
                receiptData.merchant,
                receiptData.total || receiptData.amount,
                receiptData.date || new Date().toISOString(),
                'general', // Auto-categorize or let user set
                JSON.stringify(receiptData.items || [])
            ]);

            console.log(`[DocumentScanner] Created expense record: ${result.rows[0].id}`);
        } catch (error) {
            console.error('[DocumentScanner] Error creating expense:', error);
        }
    }

    /**
     * Gets expense history
     * @param {string} userId - User ID
     * @param {number} days - Number of days
     * @returns {Promise<Array>} Expense records
     */
    async getExpenseHistory(userId, days = 30) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT *
                FROM expenses
                WHERE user_id = $1
                AND date > NOW() - INTERVAL '${days} days'
                ORDER BY date DESC
            `;

            const result = await this.db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error('[DocumentScanner] Error fetching expenses:', error);
            return [];
        }
    }
}

// Example usage:
// const scanner = new DocumentScanner({ db: dbConnection });
// const receipt = await scanner.scanReceipt(receiptImage, 'user123');
// const qrCode = await scanner.scanQRCode(qrImage);
// const whiteboard = await scanner.scanWhiteboard(whiteboardImage);
