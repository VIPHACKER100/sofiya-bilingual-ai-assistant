/**
 * SOFIYA Webhook Routes
 * Phase 3.4: Webhook for Incoming WhatsApp Messages
 * 
 * Handles incoming webhooks from Twilio/WhatsApp Business API.
 * Processes messages and forwards to NLP processor if response required.
 */

import express from 'express';
import { WhatsAppService } from '../../integrations/whatsapp-service.js';
import { NLPProcessor } from '../../voice-engine/nlp-processor.js';
import { CommandRouter } from '../command-router.js';
import { ResponseFormatter } from '../response-formatter.js';

const router = express.Router();

// Initialize services
const whatsappService = new WhatsAppService();
const nlpProcessor = new NLPProcessor();
const commandRouter = new CommandRouter({ whatsapp: whatsappService });
const responseFormatter = new ResponseFormatter();

/**
 * POST /webhooks/whatsapp
 * Receives incoming WhatsApp messages from Twilio
 */
router.post('/whatsapp', async (req, res) => {
    try {
        // Parse webhook data
        const messageData = whatsappService.parseWebhook(req.body);
        
        console.log(`[Webhook] Received WhatsApp message from ${messageData.from}: "${messageData.body}"`);

        // Log message to database (optional)
        // await logMessage(messageData);

        // Check if this is a status update (delivery receipt) vs actual message
        if (req.body.MessageStatus && req.body.MessageStatus !== 'received') {
            // This is a delivery status update, not a new message
            console.log(`[Webhook] Message status update: ${req.body.MessageSid} - ${req.body.MessageStatus}`);
            return res.status(200).send('OK');
        }

        // Process message if it contains text
        if (messageData.body && messageData.body.trim().length > 0) {
            await processIncomingMessage(messageData);
        }

        // Always respond with 200 OK to Twilio
        res.status(200).send('OK');
    } catch (error) {
        console.error('[Webhook] Error processing WhatsApp webhook:', error);
        // Still return 200 to prevent Twilio from retrying
        res.status(200).send('OK');
    }
});

/**
 * Processes incoming message and sends response if needed
 * @private
 */
async function processIncomingMessage(messageData) {
    try {
        const { from, body } = messageData;

        // Process with NLP
        const nlpResult = await nlpProcessor.process(body);

        // Route command
        const routerResult = await commandRouter.route(nlpResult, {
            userId: from, // Use phone number as user ID
            personality: 'professional' // Default personality
        });

        // Format response
        const response = responseFormatter.format(routerResult, 'professional');

        // Send response back (optional - only if command requires it)
        // For now, we'll only respond to direct commands/questions
        if (shouldRespond(nlpResult.intent)) {
            await whatsappService.sendMessage(from, response);
            console.log(`[Webhook] Sent response to ${from}`);
        }
    } catch (error) {
        console.error('[Webhook] Error processing message:', error);
        // Optionally send error message to user
        // await whatsappService.sendMessage(messageData.from, 'Sorry, I encountered an error processing your message.');
    }
}

/**
 * Determines if we should send a response
 * @private
 */
function shouldRespond(intent) {
    // Respond to system commands, questions, but not to casual messages
    const responseIntents = [
        'system_status',
        'time_date',
        'weather',
        'news',
        'search',
        'schedule',
        'task_add',
        'reminder',
        'health',
        'wellness'
    ];

    return responseIntents.includes(intent);
}

/**
 * GET /webhooks/whatsapp/status
 * Health check endpoint for webhook
 */
router.get('/whatsapp/status', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'whatsapp-webhook',
        timestamp: new Date().toISOString()
    });
});

export default router;
