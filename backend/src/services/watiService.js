const axios = require('axios');

class WatiService {
  constructor() {
    this.baseUrl = process.env.WATI_API_URL;
    this.token = process.env.WATI_API_TOKEN;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      }
    });
  }

  // Send template message (for outreach, reminders, etc.)
  async sendTemplate(phone, templateName, parameters = []) {
    try {
      const res = await this.client.post('/api/v1/sendTemplateMessage', {
        whatsappNumber: this.formatPhone(phone),
        templateName,
        parameters: parameters.map(p => ({ name: p.name, value: p.value })),
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('WATI sendTemplate error:', err.response?.data || err.message);
      return { success: false, error: err.response?.data || err.message };
    }
  }

  // Send session message (within 24h window)
  async sendMessage(phone, message) {
    try {
      const res = await this.client.post('/api/v1/sendSessionMessage/' + this.formatPhone(phone), {
        messageText: message,
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('WATI sendMessage error:', err.response?.data || err.message);
      return { success: false, error: err.response?.data || err.message };
    }
  }

  // Send media message
  async sendMedia(phone, mediaUrl, caption = '') {
    try {
      const res = await this.client.post('/api/v1/sendSessionFile/' + this.formatPhone(phone), {
        url: mediaUrl,
        caption,
      });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data || err.message };
    }
  }

  // Get contact info
  async getContact(phone) {
    try {
      const res = await this.client.get('/api/v1/getContacts', {
        params: { pageSize: 1, pageNumber: 1, whatsappNumber: this.formatPhone(phone) }
      });
      return res.data?.contact_list?.[0] || null;
    } catch (err) {
      return null;
    }
  }

  // Check if number is on WhatsApp
  async checkNumber(phone) {
    try {
      const contact = await this.getContact(phone);
      return contact ? true : false;
    } catch {
      return false;
    }
  }

  formatPhone(phone) {
    // Ensure Indian format: 91XXXXXXXXXX
    let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
    return cleaned;
  }
}

// Singleton
let instance = null;
module.exports = {
  getWatiService: () => {
    if (!instance) instance = new WatiService();
    return instance;
  }
};
