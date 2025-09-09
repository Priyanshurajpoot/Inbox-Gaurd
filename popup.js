document.addEventListener('DOMContentLoaded', () => {
  const analyzeCurrentBtn = document.getElementById('analyzeCurrent');
  const analyzeManualBtn = document.getElementById('analyzeManual');
  const manualSubject = document.getElementById('manualSubject');
  const manualSender = document.getElementById('manualSender');
  const manualBody = document.getElementById('manualBody');
  const scrapedInfo = document.getElementById('scrapedInfo');
  const status = document.getElementById('status');
  const result = document.getElementById('result');

  let scrapedEmail = null;

  // Listen for scraped data from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'emailScraped') {
      scrapedEmail = request;
      scrapedInfo.style.display = 'block';
      scrapedInfo.innerHTML = `
        <strong>Scraped from current page:</strong><br>
        Subject: ${request.subject}<br>
        Sender: ${request.sender}<br>
        Body preview: ${request.body.substring(0, 100)}...
      `;
      status.textContent = 'Scraped successfully! Click "Analyze Current" to process.';
    }
  });

  function showStatus(msg, isError = false) {
    status.textContent = msg;
    status.style.color = isError ? 'red' : '#4285f4';
  }

  function showResult(sentiment, score, subject, sender) {
    const className = sentiment + ' result';
    result.innerHTML = `
      <div class="${className}">
        Sentiment: ${sentiment.toUpperCase()} (Confidence: ${score})<br>
        Subject: ${subject}<br>
        Sender: ${sender}
      </div>
    `;
    result.style.display = 'block';
  }

  // Analyze current scraped email
  analyzeCurrentBtn.addEventListener('click', () => {
    if (!scrapedEmail) {
      showStatus('Not on a Gmail email page or scraping failed. Try manual input.', true);
      return;
    }
    analyzeText(scrapedEmail.body, scrapedEmail.subject, scrapedEmail.sender);
  });

  // Analyze manual input
  analyzeManualBtn.addEventListener('click', () => {
    const body = manualBody.value.trim();
    const subject = manualSubject.value.trim() || 'No Subject';
    const sender = manualSender.value.trim() || 'Unknown Sender';
    if (!body) {
      showStatus('Please paste email body.', true);
      return;
    }
    analyzeText(body, subject, sender);
  });

  function analyzeText(text, subject, sender) {
    analyzeCurrentBtn.disabled = analyzeManualBtn.disabled = true;
    showStatus('Analyzing... (loading model if first time)');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeCurrentEmail' }, () => {}); // Trigger scrape if needed
    });

    chrome.runtime.sendMessage({ action: 'analyzeSentiment', text }, (response) => {
      analyzeCurrentBtn.disabled = analyzeManualBtn.disabled = false;
      if (response.error) {
        showStatus(response.error, true);
      } else {
        showStatus('Analysis complete!');
        showResult(response.sentiment, response.score, subject, sender);
      }
    });
  }
});