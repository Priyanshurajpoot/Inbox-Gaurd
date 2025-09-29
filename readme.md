# Inbox Guard v2.0 - Advanced Gmail Email Analyzer

A powerful Chrome extension that scans your latest unread Gmail message, fetches the full email body via Gmail API (OAuth), and provides intelligent analysis including:

- **Email Summary** - Concise 1-3 line summary of the email content
- **Category Detection** - Phishing, Spam, Promo, Work, Personal, Finance, Social, Notifications, Unknown
- **Advanced Sentiment Analysis** - Detects actual sentiment toward you (Positive, Negative, Angry, Frustrated, Appreciative, Neutral)
- **Sentiment Summary** - Human-readable explanation of the email's tone

---

## 🚀 Features

### 1. **OAuth Authentication**
- Secure Gmail API access using Chrome Identity API
- Token caching for 55 minutes (no repeated logins)
- Automatic token refresh

### 2. **Full Email Content Fetching**
- Fetches latest unread email via Gmail API
- Decodes Base64URL encoded email bodies
- Extracts both plain text and HTML content
- Handles complex multipart MIME messages

### 3. **Intelligent Category Detection**
Detects 8+ email categories using advanced keyword matching:
- **Phishing** - Suspicious account verification requests
- **Spam** - Lottery, prizes, get-rich-quick schemes
- **Promo** - Sales, discounts, marketing offers
- **Work** - Meetings, projects, deadlines
- **Personal** - Friends, family, casual communication
- **Finance** - Bank notifications, transactions, invoices
- **Social** - Social media notifications, mentions
- **Unknown** - Miscellaneous emails

### 4. **Advanced Sentiment Analysis**
Goes beyond basic positive/negative to detect:
- **Angry** - Strong hostility, demands, threats
- **Frustrated** - Confusion, repeated issues
- **Appreciative** - Gratitude, thanks, recognition
- **Positive** - Friendly, satisfied tone
- **Negative** - Disappointment, concerns
- **Neutral** - Professional, objective tone

Includes contextual sentiment summary explaining the tone toward you.

### 5. **Email Summarization**
- Extracts key sentences (up to 3)
- Limits to 200-250 characters
- Handles both short and long emails intelligently

### 6. **Beautiful UI**
- Modern gradient design
- Color-coded category and sentiment badges
- Loading states with progress messages
- Comprehensive error handling
- Animated transitions

---

## 📋 Prerequisites

### 1. **Google Cloud Project Setup**

You need to create a Google Cloud Project and enable Gmail API:

#### Step 1: Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name it "Inbox Guard" (or anything you like)
4. Click "Create"

#### Step 2: Enable Gmail API
1. In your project, go to **APIs & Services > Library**
2. Search for "Gmail API"
3. Click on it and click "Enable"

#### Step 3: Create OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose "External" (unless you have a Google Workspace)
3. Fill in:
   - App name: "Inbox Guard"
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. On Scopes page, click "Add or Remove Scopes"
6. Add: `https://www.googleapis.com/auth/gmail.readonly`
7. Click "Save and Continue"
8. Add your email as a test user
9. Click "Save and Continue"

#### Step 4: Create OAuth Client ID
1. Go to **APIs & Services > Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Chrome Extension**
4. Name: "Inbox Guard Extension"
5. For "Item ID", you'll need your extension ID:
   - Load your extension unpacked in Chrome
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Note the extension ID (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
6. Enter the extension ID in the "Item ID" field
7. Click "Create"
8. **Copy your Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

### 2. **Update manifest.json**

Replace `YOUR_CLIENT_ID` in `manifest.json` with your actual Client ID:

```json
"oauth2": {
  "client_id": "123456789-abc.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.readonly"
  ]
}
```

---

## 🛠️ Installation

### 1. **Prepare Extension Files**

Create a folder called `inbox-guard` with these files:

```
inbox-guard/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── sentiment.js
├── content.js
├── icon16.png
├── icon48.png
└── icon128.png
```

### 2. **Create Icons**

You can create simple icons or download them. For testing, you can use any 16x16, 48x48, and 128x128 PNG images.

### 3. **Load Extension in Chrome**

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select your `inbox-guard` folder
5. The extension should now appear in your toolbar

### 4. **Update OAuth Client ID**

1. Note the extension ID from `chrome://extensions/`
2. Go back to Google Cloud Console
3. Edit your OAuth client ID
4. Update the extension ID if it changed
5. Reload your extension in Chrome

---

## 📖 Usage

### First Time Setup

1. Click the Inbox Guard extension icon
2. Click "Scan Latest Email"
3. You'll be prompted to log in to your Google account
4. Grant permission to "Read, compose, send, and permanently delete all your email from Gmail" (read-only scope)
5. The extension will fetch and analyze your latest unread email

### Subsequent Uses

1. Click the extension icon
2. Click "Scan Latest Email"
3. Results appear instantly (token is cached)

### What You'll See

**Email Information:**
- Sender name and email
- Subject line
- Email summary (1-3 lines)

**Analysis:**
- **Category Badge** - Color-coded category (e.g., "Phishing" in red, "Work" in purple)
- **Sentiment Badge** - Emotional tone (e.g., "Angry" in red, "Appreciative" in green)
- **Sentiment Summary** - Plain English explanation of the email's tone toward you

---

## 🎨 Category & Sentiment Colors

### Categories
- 🔴 **Phishing** - Red gradient
- 🟠 **Spam** - Orange gradient
- 🔵 **Promo** - Blue gradient
- 🟣 **Work** - Purple gradient
- 🟢 **Personal** - Green gradient
- 🟦 **Finance** - Teal gradient
- 🩷 **Social** - Pink gradient
- ⚫ **Unknown** - Gray gradient

### Sentiments
- 🟢 **Positive/Appreciative** - Green gradient
- ⚫ **Neutral** - Gray gradient
- 🟠 **Negative** - Orange gradient
- 🔴 **Angry/Frustrated** - Red gradient

---

## 🔒 Privacy & Security

- **No backend servers** - All processing happens client-side
- **OAuth tokens cached locally** - Stored in Chrome's secure storage
- **Read-only Gmail access** - Cannot modify or delete emails
- **No data collection** - Zero telemetry or analytics
- **Open source** - Inspect all code before installing

---

## 🐛 Troubleshooting

### "Failed to obtain access token"
- Make sure you've set up OAuth consent screen correctly
- Verify your Client ID is correct in `manifest.json`
- Check that Gmail API is enabled in your Google Cloud project
- Try removing and re-adding your extension

### "No unread emails found"
- Make sure you have at least one unread email in your inbox
- Try refreshing Gmail

### "Failed to fetch email content"
- Check your internet connection
- Verify Gmail API is enabled
- Token may have expired - try scanning again

### Extension not showing up
- Make sure Developer mode is enabled
- Check console for errors (`chrome://extensions` > Details > Inspect views)
- Verify all files are in the correct folder

---

## 🔄 How It Works

1. **Authentication**: Uses Chrome Identity API to get OAuth token
2. **Token Caching**: Stores token for 55 minutes to avoid repeated logins
3. **Email Fetching**: Calls Gmail API to get latest unread message
4. **Content Parsing**: Decodes Base64URL body, extracts text from HTML
5. **Category Detection**: Analyzes subject + body with keyword patterns
6. **Sentiment Analysis**: Uses custom sentiment analyzer with 100+ keywords
7. **Summarization**: Extracts first 3 sentences or 200-250 characters
8. **Display**: Shows all results in beautiful, animated UI

---

## 📝 Future Enhancements

- [ ] Bulk email scanning
- [ ] Historical sentiment tracking
- [ ] Custom category rules
- [ ] Export analysis results
- [ ] Multi-language support
- [ ] AI-powered summarization (GPT integration)

---

## 🤝 Contributing

Feel free to fork, modify, and improve this extension! Contributions welcome.

---

## 📄 License

MIT License - Free to use and modify

---

## ⚠️ Disclaimer

This extension is for educational and personal use. Always review permissions carefully when granting OAuth access to any application.

---

**Built with ❤️ for better email management**