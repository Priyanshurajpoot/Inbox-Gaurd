// Inbox Guard v2.0 - Main Popup Logic with Gmail API Integration

class InboxGuard {
  constructor() {
    // DOM Elements
    this.scanBtn = document.getElementById('scanBtn');
    this.retryBtn = document.getElementById('retryBtn');
    this.loading = document.getElementById('loading');
    this.loadingMsg = document.getElementById('loadingMsg');
    this.results = document.getElementById('results');
    this.error = document.getElementById('error');
    this.status = document.getElementById('status');
    
    // Initialize sentiment analyzer
    this.sentimentAnalyzer = new SentimentAnalyzer();
    
    // Token cache
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Event listeners
    this.scanBtn.addEventListener('click', () => this.scanInbox());
    this.retryBtn.addEventListener('click', () => this.scanInbox());
    
    // Check cached token on load
    this.checkCachedToken();
  }

  async checkCachedToken() {
    const cached = await chrome.storage.local.get(['accessToken', 'tokenExpiry']);
    if (cached.accessToken && cached.tokenExpiry) {
      const now = Date.now();
      if (now < cached.tokenExpiry) {
        this.accessToken = cached.accessToken;
        this.tokenExpiry = cached.tokenExpiry;
        console.log('Using cached token');
      }
    }
  }

  async getAccessToken() {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Get new token via OAuth
    this.updateLoadingMsg('Authenticating with Gmail...');
    
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (!token) {
          reject(new Error('Failed to obtain access token'));
          return;
        }

        // Cache token for 55 minutes (token usually expires in 60 mins)
        this.accessToken = token;
        this.tokenExpiry = Date.now() + (55 * 60 * 1000);
        
        chrome.storage.local.set({
          accessToken: token,
          tokenExpiry: this.tokenExpiry
        });

        resolve(token);
      });
    });
  }

  async scanInbox() {
    this.showLoading();
    
    try {
      // Get access token
      const token = await this.getAccessToken();
      
      // Fetch latest unread email
      this.updateLoadingMsg('Fetching latest unread email...');
      const messageId = await this.getLatestUnreadMessageId(token);
      
      if (!messageId) {
        throw new Error('No unread emails found in your inbox');
      }

      // Get full email content
      this.updateLoadingMsg('Loading email content...');
      const emailData = await this.getEmailContent(token, messageId);
      
      // Analyze email
      this.updateLoadingMsg('Analyzing email...');
      await this.analyzeAndDisplay(emailData);
      
    } catch (err) {
      console.error('Scan error:', err);
      this.showError(err.message || 'Failed to scan inbox');
    }
  }

  async getLatestUnreadMessageId(token) {
    const response = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages list');
    }

    const data = await response.json();
    
    if (!data.messages || data.messages.length === 0) {
      return null;
    }

    return data.messages[0].id;
  }

  async getEmailContent(token, messageId) {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch email content');
    }

    const message = await response.json();
    
    return {
      subject: this.getHeader(message.payload.headers, 'Subject'),
      sender: this.getHeader(message.payload.headers, 'From'),
      senderEmail: this.extractEmailFromSender(this.getHeader(message.payload.headers, 'From')),
      body: this.getEmailBody(message.payload),
      raw: message
    };
  }

  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  }

  extractEmailFromSender(fromHeader) {
    const match = fromHeader.match(/<(.+?)>/);
    if (match) return match[1];
    
    // If no brackets, assume entire string is email
    if (fromHeader.includes('@')) return fromHeader;
    
    return '';
  }

  getEmailBody(payload) {
    // Try to get plain text body first
    let body = '';
    
    if (payload.parts) {
      // Multipart email
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = this.decodeBase64(part.body.data);
          break;
        }
      }
      
      // If no plain text found, try HTML
      if (!body) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body.data) {
            const html = this.decodeBase64(part.body.data);
            body = this.stripHtml(html);
            break;
          }
        }
      }
      
      // Check nested parts (for complex multipart messages)
      if (!body) {
        body = this.extractFromNestedParts(payload.parts);
      }
    } else if (payload.body && payload.body.data) {
      // Simple email with body directly in payload
      body = this.decodeBase64(payload.body.data);
      if (payload.mimeType === 'text/html') {
        body = this.stripHtml(body);
      }
    }
    
    return body.trim();
  }

  extractFromNestedParts(parts) {
    for (const part of parts) {
      if (part.parts) {
        const nested = this.extractFromNestedParts(part.parts);
        if (nested) return nested;
      }
      if (part.mimeType === 'text/plain' && part.body.data) {
        return this.decodeBase64(part.body.data);
      }
    }
    return '';
  }

  decodeBase64(encoded) {
    try {
      // Gmail uses Base64URL encoding (- and _ instead of + and /)
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
      console.error('Base64 decode error:', e);
      return '';
    }
  }

  stripHtml(html) {
    // Remove script and style tags completely
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Replace common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  async analyzeAndDisplay(emailData) {
    // Detect category
    const category = this.detectCategory(emailData.subject, emailData.body);
    
    // Analyze sentiment
    const sentimentResult = this.sentimentAnalyzer.analyze(emailData.body);
    
    // Generate summary
    const summary = this.generateSummary(emailData.body);
    
    // Display results
    this.displayResults(emailData, category, sentimentResult, summary);
  }

  detectCategory(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    
    // Phishing patterns (highest priority)
    const phishingPatterns = [
      /verify.*account/i, /account.*suspended/i, /click here.*immediately/i,
      /urgent.*action.*required/i, /confirm.*identity/i, /update.*payment.*method/i,
      /suspicious.*activity/i, /secure.*account/i, /expires.*today/i,
      /reset.*password.*now/i, /unauthorized.*access/i, /locked.*account/i
    ];
    
    if (phishingPatterns.some(pattern => pattern.test(text))) {
      return 'phishing';
    }
    
    // Spam patterns
    const spamPatterns = [
      /you('ve| have) won/i, /lottery/i, /claim.*prize/i, /free.*gift/i,
      /congratulations.*selected/i, /act now/i, /limited.*offer.*ends/i,
      /make money fast/i, /work from home/i, /no cost/i
    ];
    
    if (spamPatterns.some(pattern => pattern.test(text))) {
      return 'spam';
    }
    
    // Finance patterns
    const financePatterns = [
      /bank/i, /transaction/i, /payment/i, /invoice/i, /receipt/i,
      /statement/i, /balance/i, /credit card/i, /debit/i, /transfer/i,
      /paypal/i, /venmo/i, /wire/i, /refund/i, /charge/i
    ];
    
    if (financePatterns.some(pattern => pattern.test(text))) {
      return 'finance';
    }
    
    // Work patterns
    const workPatterns = [
      /meeting/i, /project/i, /deadline/i, /report/i, /task/i,
      /schedule/i, /team/i, /conference/i, /presentation/i, /review/i,
      /proposal/i, /client/i, /budget/i, /milestone/i, /deliverable/i
    ];
    
    if (workPatterns.some(pattern => pattern.test(text))) {
      return 'work';
    }
    
    // Social/Notifications patterns
    const socialPatterns = [
      /facebook/i, /twitter/i, /instagram/i, /linkedin/i, /notification/i,
      /someone.*commented/i, /new.*follower/i, /tagged you/i, /mentioned you/i,
      /friend request/i, /connection request/i, /message.*from/i
    ];
    
    if (socialPatterns.some(pattern => pattern.test(text))) {
      return 'social';
    }
    
    // Promo/Marketing patterns
    const promoPatterns = [
      /sale/i, /discount/i, /\d+%\s*off/i, /deal/i, /promotion/i,
      /special offer/i, /limited time/i, /save/i, /clearance/i,
      /new arrival/i, /exclusive/i, /shop now/i
    ];
    
    if (promoPatterns.some(pattern => pattern.test(text))) {
      return 'promo';
    }
    
    // Personal patterns
    const personalPatterns = [
      /\bhi\b/i, /\bhello\b/i, /\bhey\b/i, /dear/i, /love/i,
      /friend/i, /family/i, /how are you/i, /hope you('re| are)/i
    ];
    
    if (personalPatterns.some(pattern => pattern.test(text))) {
      return 'personal';
    }
    
    return 'unknown';
  }

  generateSummary(body) {
    if (!body || body.length === 0) {
      return 'No content available for summary.';
    }
    
    // Clean the body
    let text = body.replace(/\s+/g, ' ').trim();
    
    // If body is short enough, return it as is (up to 200 chars)
    if (text.length <= 200) {
      return text;
    }
    
    // Extract first few sentences (up to 3 sentences or 250 chars)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let summary = '';
    let charCount = 0;
    
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (charCount + sentence.length > 250) break;
      summary += sentence + ' ';
      charCount += sentence.length;
    }
    
    summary = summary.trim();
    
    // If we got a good summary, return it
    if (summary.length > 50) {
      return summary.length > 250 ? summary.substring(0, 247) + '...' : summary;
    }
    
    // Fallback: Just take first 200 characters
    return text.substring(0, 200) + '...';
  }

  displayResults(emailData, category, sentimentResult, summary) {
    this.hideAll();
    
    // Extract sender name from "Name <email>" format
    let senderName = emailData.sender;
    const nameMatch = emailData.sender.match(/^([^<]+)</);
    if (nameMatch) {
      senderName = nameMatch[1].trim();
    }
    
    // Populate email info
    document.getElementById('sender').textContent = senderName || 'Unknown Sender';
    document.getElementById('email').textContent = emailData.senderEmail || 'Not available';
    document.getElementById('subject').textContent = emailData.subject || 'No subject';
    document.getElementById('summary').textContent = summary;
    
    // Set category badge
    const categoryBadge = document.querySelector('.badge.category');
    categoryBadge.className = `badge category ${category}`;
    document.getElementById('category').textContent = category;
    
    // Set sentiment badge
    const sentimentBadge = document.querySelector('.badge.sentiment');
    sentimentBadge.className = `badge sentiment ${sentimentResult.sentiment}`;
    document.getElementById('sentiment').textContent = sentimentResult.sentiment;
    
    // Set sentiment summary
    document.getElementById('sentimentIcon').textContent = sentimentResult.icon;
    document.getElementById('sentimentSummary').textContent = sentimentResult.summary;
    
    // Show results
    this.results.classList.remove('hidden');
    this.status.textContent = 'Analysis Complete';
  }

  updateLoadingMsg(msg) {
    this.loadingMsg.textContent = msg;
  }

  showLoading() {
    this.hideAll();
    this.loading.classList.remove('hidden');
    this.status.textContent = 'Scanning...';
  }

  showError(msg) {
    this.hideAll();
    document.getElementById('errorMsg').textContent = msg;
    this.error.classList.remove('hidden');
    this.status.textContent = 'Error';
  }

  hideAll() {
    this.loading.classList.add('hidden');
    this.results.classList.add('hidden');
    this.error.classList.add('hidden');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new InboxGuard();
});