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

// Send a WhatsApp message via Meta Cloud API
const sendWhatsAppMessage = async (to, messagePayload) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${config.whatsapp.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        ...messagePayload,
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

      // Auto-reply with interactive store link button
      const interactivePayload = {
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          header: {
            type: 'text',
            text: '🎉 Welcome to TheParchoons! 🛒'
          },
          body: {
            text: 'Hey there! 👋\n\n🥦 Fresh vegetables\n🍚 Premium groceries\n🚚 Fast doorstep delivery\n\nTap below to start shopping 👇'
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: '🛍️ Shop Now',
              url: 'https://the-parchoons.vercel.app'
            }
          }
        }
      };
      await sendWhatsAppMessage(from, interactivePayload);
    }
    
    // Meta expects a 200 OK to acknowledge receipt
    return res.status(200).send('EVENT_RECEIVED');
  } else {
    return res.sendStatus(404);
  }
});

module.exports = router;
