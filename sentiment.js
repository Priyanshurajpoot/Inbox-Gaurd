// Sentiment Analysis Library for Inbox Guard
// Lightweight sentiment analyzer with contextual understanding

class SentimentAnalyzer {
  constructor() {
    this.positiveWords = [
      'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'happy', 'pleased', 'delighted', 'satisfied', 'appreciate', 'thanks',
      'thank', 'grateful', 'love', 'perfect', 'best', 'good', 'nice',
      'beautiful', 'brilliant', 'terrific', 'fabulous', 'outstanding',
      'superb', 'congratulations', 'congrats', 'well done', 'impressive',
      'excited', 'thrilled', 'looking forward', 'helpful', 'kind'
    ];

    this.negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate',
      'disappointing', 'disappointed', 'unfortunate', 'unfortunately',
      'problem', 'issue', 'error', 'fail', 'failed', 'failure', 'wrong',
      'incorrect', 'concern', 'worried', 'sad', 'upset', 'unhappy',
      'annoyed', 'irritated', 'trouble', 'difficult', 'complaint',
      'unsatisfied', 'dissatisfied', 'regret', 'sorry', 'apologize'
    ];

    this.angryWords = [
      'angry', 'furious', 'outraged', 'livid', 'enraged', 'mad', 'infuriated',
      'frustrated', 'frustrating', 'ridiculous', 'unacceptable', 'disgrace',
      'disgusting', 'pathetic', 'incompetent', 'useless', 'stupid', 'idiotic',
      'demand', 'immediately', 'lawyer', 'legal action', 'sue', 'report',
      'escalate', 'manager', 'supervisor', 'complaint', 'warning'
    ];

    this.frustratedWords = [
      'frustrated', 'frustrating', 'confused', 'confusing', 'stuck',
      'difficulty', 'struggling', 'complicated', 'unclear', 'lost',
      'dont understand', 'not working', 'still waiting', 'no response',
      'ignored', 'repeatedly', 'again and again', 'multiple times'
    ];

    this.appreciativeWords = [
      'appreciate', 'appreciated', 'appreciation', 'grateful', 'gratitude',
      'thank you', 'thanks', 'thanking', 'acknowledge', 'recognition',
      'valued', 'helpful', 'assist', 'assistance', 'support', 'supportive'
    ];

    this.urgentWords = [
      'urgent', 'immediately', 'asap', 'emergency', 'critical', 'important',
      'attention required', 'action required', 'deadline', 'time sensitive'
    ];
  }

  analyze(text) {
    if (!text) return this.neutralResult();

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let positiveScore = 0;
    let negativeScore = 0;
    let angryScore = 0;
    let frustratedScore = 0;
    let appreciativeScore = 0;

    // Count sentiment words
    words.forEach(word => {
      if (this.positiveWords.some(pw => word.includes(pw))) positiveScore++;
      if (this.negativeWords.some(nw => word.includes(nw))) negativeScore++;
      if (this.angryWords.some(aw => word.includes(aw))) angryScore += 2; // Weight angry words more
      if (this.frustratedWords.some(fw => word.includes(fw))) frustratedScore++;
      if (this.appreciativeWords.some(apw => word.includes(apw))) appreciativeScore += 1.5;
    });

    // Check for phrase patterns
    if (/thank you|thanks so much|really appreciate/i.test(text)) appreciativeScore += 2;
    if (/extremely (angry|frustrated|disappointed)/i.test(text)) angryScore += 3;
    if (/this is (ridiculous|unacceptable|pathetic)/i.test(text)) angryScore += 3;
    if (/i('m| am) (angry|furious|outraged)/i.test(text)) angryScore += 3;
    
    // Check for negations
    if (/not (good|great|happy|satisfied|pleased)/i.test(text)) {
      negativeScore += 2;
      positiveScore = Math.max(0, positiveScore - 2);
    }
    if (/no (problem|issue|concerns)/i.test(text)) {
      positiveScore += 1;
      negativeScore = Math.max(0, negativeScore - 1);
    }

    // Determine primary sentiment
    const totalScore = positiveScore + negativeScore + angryScore + frustratedScore + appreciativeScore;
    
    if (totalScore === 0) return this.neutralResult();

    // Calculate relative scores
    const posRatio = (positiveScore + appreciativeScore) / totalScore;
    const negRatio = (negativeScore + angryScore + frustratedScore) / totalScore;
    
    if (angryScore >= 3 || (angryScore >= 2 && negRatio > 0.6)) {
      return {
        sentiment: 'angry',
        score: angryScore,
        summary: 'This email expresses strong anger or hostility toward you. The sender appears upset and may be making demands or threats.',
        icon: '😠'
      };
    }

    if (frustratedScore >= 2 && negRatio > 0.5) {
      return {
        sentiment: 'frustrated',
        score: frustratedScore,
        summary: 'The sender seems frustrated or confused, possibly due to unresolved issues or communication difficulties.',
        icon: '😤'
      };
    }

    if (appreciativeScore >= 2 || (appreciativeScore > positiveScore && posRatio > 0.5)) {
      return {
        sentiment: 'appreciative',
        score: appreciativeScore,
        summary: 'The sender is expressing genuine gratitude and appreciation toward you or your work.',
        icon: '🙏'
      };
    }

    if (posRatio > 0.6) {
      return {
        sentiment: 'positive',
        score: positiveScore,
        summary: 'This email has a positive and friendly tone. The sender appears satisfied or pleased.',
        icon: '😊'
      };
    }

    if (negRatio > 0.6) {
      return {
        sentiment: 'negative',
        score: negativeScore,
        summary: 'This email has a negative tone. The sender may be disappointed, concerned, or reporting issues.',
        icon: '😟'
      };
    }

    return {
      sentiment: 'neutral',
      score: 0,
      summary: 'This email has a neutral, professional tone without strong emotional indicators.',
      icon: '😐'
    };
  }

  neutralResult() {
    return {
      sentiment: 'neutral',
      score: 0,
      summary: 'This email has a neutral, professional tone without strong emotional indicators.',
      icon: '😐'
    };
  }
}

// Export for use in popup.js
window.SentimentAnalyzer = SentimentAnalyzer;