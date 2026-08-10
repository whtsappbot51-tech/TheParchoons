const express = require('express');
const router = express.Router();
const config = require('../config/config');

// GET /webhook — Webhook verification endpoint requested by Meta
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      console.log('✅ Webhook verified successfully by Meta.');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Webhook verification failed. Tokens do not match.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// POST /webhook — Listen for incoming WhatsApp messages
// For TheParchoons MVP, we just acknowledge receipt to keep Meta happy, 
// since ordering happens via the website, not a conversational bot.
router.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      console.log(`📥 Received WhatsApp message from ${message.from}`);
      // Future expansion: auto-reply with link to website if they message the bot
    }
    
    // Meta expects a 200 OK to acknowledge receipt
    return res.status(200).send('EVENT_RECEIVED');
  } else {
    return res.sendStatus(404);
  }
});

module.exports = router;
