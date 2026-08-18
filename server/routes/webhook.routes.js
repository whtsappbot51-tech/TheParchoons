const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/config');

// GET /webhook - Webhook verification endpoint requested by Meta
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      console.log('Webhook verified successfully by Meta.');
      return res.status(200).send(challenge);
    } else {
      console.warn('Webhook verification failed. Tokens do not match.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// Send a WhatsApp text message via Meta Cloud API
const sendWhatsAppMessage = async (to, text) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${config.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${config.whatsapp.token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err.response?.data || err.message);
  }
};

// POST /webhook - Listen for incoming WhatsApp messages
router.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      console.log(`Received WhatsApp message from ${from}: ${message.text?.body || '[media]'}`);

      // Auto-reply with store link
      const replyText = `Welcome to TheParchoons! Browse our store and place your order here:\nhttps://the-parchoons.vercel.app\n\nWe deliver fresh groceries right to your doorstep!`;
      await sendWhatsAppMessage(from, replyText);
    }
    
    // Meta expects a 200 OK to acknowledge receipt
    return res.status(200).send('EVENT_RECEIVED');
  } else {
    return res.sendStatus(404);
  }
});

module.exports = router;
