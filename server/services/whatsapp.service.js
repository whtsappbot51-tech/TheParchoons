const axios = require('axios');
const config = require('../config/config');

/**
 * Posts message payload to Meta Graph API or mocks it if not configured.
 */
const postToMeta = async (payload) => {
  if (payload.to) {
    payload.to = String(payload.to).replace(/[^0-9]/g, '');
  }
  const phone = payload.to;
  const { token, phoneNumberId, apiVersion } = config.whatsapp;

  const isConfigured = token &&
    token !== 'your_whatsapp_access_token' &&
    phoneNumberId &&
    phoneNumberId !== 'your_phone_number_id';

  if (!isConfigured) {
    console.log(`🤖 [MOCK SEND to ${phone}]: type = ${payload.type}`);
    return { success: true, mock: true };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`✅ [REAL SEND to ${phone}] Message ID: ${response.data?.messages?.[0]?.id}`);
    return { success: true, mock: false, data: response.data };
  } catch (err) {
    const errorData = err.response ? JSON.stringify(err.response.data) : err.message;
    console.error(`❌ [META API ERROR] when sending to ${phone}:`, errorData);
    return { success: false, mock: false, error: err.message };
  }
};

const whatsappService = {
  /**
   * Sends a simple text message.
   */
  async sendText(to, text) {
    return postToMeta({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    });
  },

  /**
   * Sends interactive reply buttons (up to 3).
   */
  async sendButtons(to, bodyText, buttons, headerText = null, footerText = null) {
    const formattedButtons = buttons.map(btn => ({
      type: 'reply',
      reply: { id: btn.id, title: btn.title.substring(0, 20) },
    }));

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: formattedButtons },
      },
    };

    if (headerText) payload.interactive.header = { type: 'text', text: headerText };
    if (footerText) payload.interactive.footer = { text: footerText };

    return postToMeta(payload);
  },

  /**
   * Sends a CTA URL button message.
   */
  async sendUrlButton(to, bodyText, btnTitle, url) {
    return postToMeta({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: bodyText },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: btnTitle.substring(0, 20),
            url,
          },
        },
      },
    });
  },
};

module.exports = whatsappService;
