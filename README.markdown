# Gmail Sentiment Analyzer Chrome Extension

A Chrome extension that analyzes the sentiment of emails viewed in Gmail or manually pasted email text using a local AI model (DistilBERT). No external APIs are required, ensuring privacy and offline capability.

## Features
- **Real-Time Analysis**: Analyzes the current Gmail email you're viewing (scraped from the page) or text pasted manually.
- **Local Sentiment Model**: Uses Transformers.js with DistilBERT (`Xenova/distilbert-base-uncased-finetuned-sst-2-english`) for offline sentiment analysis (positive, negative, neutral).
- **No APIs**: Works without Gmail API or external services, relying on browser-based scraping or user input.
- **User-Friendly**: Popup interface to view results or input email details manually.
- **Privacy**: All processing is local; no data is sent to servers.

## Installation
1. Clone or download this repository:
   ```bash
   https://github.com/Priyanshurajpoot/Inbox-Gaurd.git
   ```
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" (top-right toggle).
4. Click "Load unpacked" and select the `Inbox-Gaurd` folder.
5. Pin the extension to your toolbar for easy access.

## Usage
1. **Analyze Gmail Email**:
   - Open Gmail and view an email (e.g., `https://mail.google.com/mail/u/0/#inbox/abc123`).
   - Click the extension icon.
   - If on a valid email page, it auto-scrapes subject, sender, and body. Click "Analyze Current Gmail Email" to see sentiment.
2. **Manual Input**:
   - If not on Gmail or scraping fails, enter subject, sender, and body in the popup.
   - Click "Analyze Pasted Email" to process.
3. **View Results**:
   - Sentiment (POSITIVE, NEGATIVE, NEUTRAL) with confidence score is displayed.
   - Colors: Green (positive), Red (negative), Yellow (neutral).

## Notes
- **Gmail Scraping**: Relies on Gmail's current DOM (as of September 2025). If selectors break (e.g., UI changes), update `content.js` selectors via Inspect Element.
- **Model Load Time**: First analysis may take 10-20 seconds to load the model (~250MB, cached locally afterward).
- **Limitations**:
  - Only analyzes the email currently open in Gmail (no full mailbox scanning due to no API).
  - Scraping may fail if Gmail's UI changes significantly; use manual input as fallback.
  - Neutral sentiment is inferred for low-confidence negatives (adjust threshold in `background.js` if needed).
- **Performance**: Model runs in WebAssembly; expect 1-5 seconds per analysis on typical hardware.

## Development
- Built with JavaScript, HTML, CSS, and Transformers.js.
- Update selectors in `content.js` if Gmail's UI changes.
- To add features (e.g., save results to file), modify `popup.js` and use `chrome.storage`.

## License
MIT License
