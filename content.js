// Inbox Guard v2.0 - Content Script
// Fallback DOM scraper for Gmail (used if API fails)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanLatestEmail') {
    scrapeLatestUnreadEmail()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function scrapeLatestUnreadEmail() {
  // Wait for Gmail to be ready
  await waitForGmail();
  
  // Find the latest unread email in inbox
  const unreadEmails = document.querySelectorAll('tr.zA.zE');
  
  if (unreadEmails.length === 0) {
    throw new Error('No unread emails found in inbox');
  }
  
  // Get the first (latest) unread email
  const latestEmail = unreadEmails[0];
  
  // Extract data from the email row
  const emailData = {
    subject: extractSubject(latestEmail),
    sender: extractSender(latestEmail),
    senderEmail: extractSenderEmail(latestEmail),
    body: extractBodyPreview(latestEmail)
  };
  
  // Validate we got some data
  if (!emailData.subject && !emailData.sender) {
    throw new Error('Unable to extract email data. Please refresh Gmail.');
  }
  
  return emailData;
}

function extractSubject(emailRow) {
  // Subject is in the .y6 span or .bog span
  const subjectEl = emailRow.querySelector('.y6 span.bog') || 
                    emailRow.querySelector('.bog') ||
                    emailRow.querySelector('span[data-thread-id]');
  return subjectEl ? subjectEl.textContent.trim() : '';
}

function extractSender(emailRow) {
  // Sender name is in .yW span with class .zF
  const senderEl = emailRow.querySelector('.yW span.zF') ||
                   emailRow.querySelector('.yW .yP') ||
                   emailRow.querySelector('span[email]');
  return senderEl ? senderEl.textContent.trim() : '';
}

function extractSenderEmail(emailRow) {
  // Sender email is in the email attribute
  const emailEl = emailRow.querySelector('span[email]') ||
                  emailRow.querySelector('[email]');
  
  if (emailEl) {
    return emailEl.getAttribute('email') || '';
  }
  
  // Fallback: look for email pattern in title attributes
  const titleEl = emailRow.querySelector('[title*="@"]');
  if (titleEl) {
    const title = titleEl.getAttribute('title');
    const emailMatch = title.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) return emailMatch[1];
  }
  
  return '';
}

function extractBodyPreview(emailRow) {
  // Body preview is in the .y2 span
  const bodyEl = emailRow.querySelector('.y2') ||
                 emailRow.querySelector('span.y2');
  return bodyEl ? bodyEl.textContent.trim() : '';
}

function waitForGmail(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      // Check if Gmail inbox is loaded
      const inboxLoaded = document.querySelector('tr.zA') || 
                         document.querySelector('[role="main"]');
      
      if (inboxLoaded) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Gmail inbox not loaded'));
      } else {
        setTimeout(check, 200);
      }
    };
    
    check();
  });
}

// Listen for Gmail navigation changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('Gmail navigation detected');
  }
}).observe(document, { subtree: true, childList: true });