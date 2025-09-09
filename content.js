// Content script: Runs on Gmail pages to scrape current email
if (window.location.hostname === 'mail.google.com') {
  // Wait for page to load (Gmail is dynamic)
  const observer = new MutationObserver(() => {
    // Check if on a single email view (URL has /#inbox/messageId or similar)
    if (window.location.hash.includes('/')) {
      scrapeCurrentEmail();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  function scrapeCurrentEmail() {
    try {
      // Gmail DOM selectors (may need updates if UI changes; tested on 2025 Gmail)
      const subject = document.querySelector('h2.hP')?.textContent.trim() || 'No Subject';
      const sender = document.querySelector('span[email]')?.textContent.trim() || 
                     document.querySelector('.gD')?.textContent.trim() || 'Unknown Sender';
      
      // Email body: Look for main content div
      const bodyDiv = document.querySelector('div.a3s.aiL'); // Plain text body
      let body = bodyDiv ? bodyDiv.innerText : '';
      
      // Fallback to HTML body if plain not found
      if (!body) {
        const htmlBody = document.querySelector('div[dir="ltr"] div');
        body = htmlBody ? htmlBody.innerText : '';
      }
      
      // Clean body (strip signatures, trim)
      body = body.replace(/Sent from.*$/i, '').replace(/\s+/g, ' ').trim();
      body = body.substring(0, 512); // Limit for model
      
      if (body) {
        // Store for popup access (via message)
        chrome.runtime.sendMessage({ action: 'emailScraped', subject, sender, body });
        console.log('Scraped email:', { subject, sender, body: body.substring(0, 100) + '...' });
      }
    } catch (error) {
      console.error('Scraping error:', error);
    }
  }

  // Listen for popup requests to scrape
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeCurrentEmail') {
      scrapeCurrentEmail();
      sendResponse({ success: true });
    }
  });
}