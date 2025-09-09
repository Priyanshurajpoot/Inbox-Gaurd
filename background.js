// Background service worker: Loads sentiment model for reuse
let sentimentPipe = null;

// Initialize local sentiment analyzer (DistilBERT via Transformers.js)
async function initSentimentAnalyzer() {
  if (!sentimentPipe) {
    try {
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
      sentimentPipe = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      console.log('Local sentiment model loaded successfully');
    } catch (error) {
      console.error('Failed to load sentiment model:', error);
      sentimentPipe = null;
    }
  }
  return sentimentPipe;
}

// Listen for messages from popup/content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeSentiment') {
    initSentimentAnalyzer().then(async (pipe) => {
      if (!pipe) {
        sendResponse({ error: 'Model failed to load. Try refreshing.' });
        return;
      }
      try {
        const result = await pipe(request.text);
        const label = result[0].label.toLowerCase();
        const score = result[0].score;
        // Map low-confidence to 'neutral'
        const sentiment = (score > 0.7 || label === 'positive') ? label : 'neutral';
        sendResponse({ sentiment, score: score.toFixed(2) });
      } catch (error) {
        sendResponse({ error: 'Analysis failed: ' + error.message });
      }
    });
    return true; // Async response
  }
});