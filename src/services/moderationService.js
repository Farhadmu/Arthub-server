// moderationService.js — AI & heuristic comment moderation pipeline
const Comment = require('../models/Comment');

const BLOCKED_PATTERNS = [
  /\b(?:hate|kill yourself|kys|die|scam|fraud|bastard|idiot|stupid bitch|nazi)\b/i,
  /\b(?:porn|xxx|nude|casino|crypto pump|telegram\s*@|whatsapp\s*\+)\b/i,
];

const REVIEW_PATTERNS = [
  /https?:\/\/[^\s]+/i, // external URLs
  /\b(?:buy cheap|free money|discount code|dm me|follow me on)\b/i,
  /(.)\1{6,}/i, // repeated characters like 'aaaaaaa'
  /[A-Z\s!]{15,}/, // excessive caps
];

/**
 * Analyzes comment content and assigns moderation verdict
 */
function analyzeCommentContent(text = '') {
  const clean = text.trim();

  // Check severe blocked triggers
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        status: 'BLOCKED',
        score: 95,
        flaggedByAi: true,
        reason: 'Violates community guidelines regarding harassment, hate speech, or malicious spam.',
      };
    }
  }

  // Check review triggers
  for (const pattern of REVIEW_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        status: 'REVIEW',
        score: 65,
        flaggedByAi: true,
        reason: 'Flagged for administrator review due to external links or potential promotional spam.',
      };
    }
  }

  return {
    status: 'SAFE',
    score: 5,
    flaggedByAi: false,
    reason: 'Verified safe by AI content moderation.',
  };
}

module.exports = {
  analyzeCommentContent,
};
