// Password Insight: Strength and predictability analysis logic
const passwordInput = document.getElementById('passwordInput');
const showPassword = document.getElementById('showPassword');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const strengthScoreEl = document.getElementById('strengthScore');
const predictabilityScoreEl = document.getElementById('predictabilityScore');
const strengthCategoryEl = document.getElementById('strengthCategory');
const predictabilityCategoryEl = document.getElementById('predictabilityCategory');
const strengthProgress = document.getElementById('strengthProgress');
const predictabilityProgress = document.getElementById('predictabilityProgress');
const strengthSuggestionsEl = document.getElementById('strengthSuggestions');
const predictabilitySuggestionsEl = document.getElementById('predictabilitySuggestions');
const healthSummaryEl = document.getElementById('healthSummary');

const commonWords = [
  'password', 'admin', 'welcome', 'football', 'barcelona', 'arsenal', 'liverpool', 'chelsea', 'madrid'
];
const dictionaryWords = [
  ...commonWords,
  'hello', 'name', 'my', 'is', 'login', 'account', 'secret', 'user', 'guest', 'hello', 'welcome', 'please', 'thanks'
];
const personalNames = ['ishan', 'john', 'jane', 'maria', 'alex', 'michael', 'sarah', 'david', 'laura'];
const keyboardPatterns = ['qwerty', 'asdf', 'zxcv'];
const numericPatterns = ['1234', '12345', '123456', '9876'];
const alphabetPatterns = ['abcd', 'abc123', 'xyz'];
const repeatedPatterns = ['aaaa', '1111', '$$$$'];
const commonPhrases = ['hello my name is', 'my name is', 'password is', 'let me in', 'welcome back'];

// Determine strength category based on score.
function getStrengthCategory(score) {
  if (score >= 85) return 'Very Strong';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Weak';
  return 'Very Weak';
}

function getPredictabilityCategory(score) {
  if (score <= 20) return 'Very Low Predictability';
  if (score <= 40) return 'Low Predictability';
  if (score <= 60) return 'Moderate Predictability';
  if (score <= 80) return 'High Predictability';
  return 'Very High Predictability';
}

// Choose color gradient for a score.
function getColorForScore(score, isPredictability = false) {
  const value = isPredictability ? 100 - score : score;
  if (value >= 85) return '#15803d';
  if (value >= 70) return '#65a30d';
  if (value >= 50) return '#eab308';
  if (value >= 30) return '#ea580c';
  return '#b91c1c';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRawMatchingText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tokenizePassword(text) {
  const splitOnSeparators = text.replace(/[^A-Za-z0-9]+/g, ' ');
  const splitCamel = splitOnSeparators
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2');

  return splitCamel
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());
}

function normalizeToken(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeWords(text) {
  return tokenizePassword(text);
}

function findMatches(text, list) {
  const normalizedText = getRawMatchingText(text);
  const matches = new Set();

  list.forEach((word) => {
    const normalizedWord = normalizeToken(word);
    if (normalizedWord && normalizedText.includes(normalizedWord)) {
      matches.add(word);
    }
  });

  return [...matches];
}

function countDictionaryMatches(text) {
  return findMatches(text, dictionaryWords).length;
}

function containsPersonalName(text) {
  return findMatches(text, personalNames).length > 0;
}

function resemblesSentence(text) {
  const words = normalizeWords(text);
  const sentenceIndicators = ['hello', 'my', 'name', 'is', 'i', 'you', 'the', 'this', 'that', 'for', 'with', 'and'];
  const indicatorCount = sentenceIndicators.filter((word) => words.includes(word)).length;
  const fallbackIndicators = findMatches(text, ['hello', 'my', 'name', 'is', 'please', 'thanks']);

  return words.length >= 4 ? indicatorCount >= 2 : fallbackIndicators.length > 0;
}

function calculateStrength(password) {
  if (!password) return 0;
  const normalized = password.toLowerCase();
  const lengthScore = clamp(password.length * 2, 0, 24);
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const digits = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  const variety = upper + lower + digits + special;
  const varietyScore = variety * 20;
  const uniqueChars = new Set(password).size;
  const diversityScore = clamp(uniqueChars * 1.5, 0, 16);
  const dictionaryMatches = countDictionaryMatches(normalized);
  const hasName = containsPersonalName(normalized);
  const sentenceLike = resemblesSentence(normalized);

  let penalty = 0;
  if (dictionaryMatches > 1) penalty += (dictionaryMatches - 1) * 12;
  if (hasName) penalty += 16;
  if (sentenceLike) penalty += 16;
  if (variety < 3) penalty += (3 - variety) * 10;

  return clamp(lengthScore + varietyScore + diversityScore - penalty, 0, 100);
}

function calculatePredictability(password) {
  if (!password) return 0;
  const normalized = password.toLowerCase();
  let score = 0;
  const dictionaryMatches = countDictionaryMatches(normalized);

  commonWords.forEach((word) => {
    if (normalized.includes(word)) score += 18;
  });

  if (dictionaryMatches > 1) {
    score += Math.min((dictionaryMatches - 1) * 12, 30);
  }

  if (containsPersonalName(normalized)) score += 18;
  if (resemblesSentence(normalized)) score += 20;

  keyboardPatterns.forEach((pattern) => {
    if (normalized.includes(pattern)) score += 15;
  });

  numericPatterns.forEach((pattern) => {
    if (normalized.includes(pattern)) score += 12;
  });

  alphabetPatterns.forEach((pattern) => {
    if (normalized.includes(pattern)) score += 10;
  });

  repeatedPatterns.forEach((pattern) => {
    if (normalized.includes(pattern)) score += 12;
  });

  commonPhrases.forEach((phrase) => {
    if (normalized.includes(normalizeToken(phrase))) score += 15;
  });

  const yearMatch = normalized.match(/19\d{2}|20\d{2}/g);
  if (yearMatch) score += yearMatch.length * 10;

  const repeatedCharMatches = normalized.match(/(.)\1{3,}/g);
  if (repeatedCharMatches) score += repeatedCharMatches.length * 8;

  const patternSequence = /(0123|1234|2345|3456|4567|5678|6789|9876)/;
  if (patternSequence.test(normalized)) score += 12;

  return clamp(score, 0, 100);
}

function getStrengthMessages(category) {
  switch (category) {
    case 'Very Strong':
      return [
        'Excellent password complexity with strong character variety and length.',
        'Strong resistance against common password attacks.'
      ];
    case 'Strong':
      return [
        'Good password structure and character diversity.',
        'Consider additional length for maximum security.'
      ];
    case 'Moderate':
      return ['Consider increasing length or adding more character variety.'];
    case 'Weak':
      return ['Add uppercase letters, numbers, and special characters.'];
    default:
      return ['Create a longer password with a mix of character types.'];
  }
}

function getPredictabilityMessages(category) {
  switch (category) {
    case 'Very Low Predictability':
      return [
        'No common words, dates, names, or recognizable patterns detected.',
        'Excellent use of unpredictable character sequences.'
      ];
    case 'Low Predictability':
      return ['Mostly unpredictable with only minor recognizable patterns.'];
    case 'Moderate Predictability':
      return ['Some recognizable patterns were detected.', 'Consider more random combinations.'];
    case 'High Predictability':
      return ['Avoid common words, names, dates, or familiar phrases.'];
    default:
      return ['Avoid keyboard patterns, dictionary words, repeated sequences, and personal information.'];
  }
}

function getHealthSummary(strengthCategory, predictabilityCategory) {
  if (strengthCategory === 'Very Strong' && predictabilityCategory === 'Very Low Predictability') {
    return 'Excellent Password\nStrong password with very low predictability.';
  }
  if (strengthCategory === 'Strong' && predictabilityCategory === 'Low Predictability') {
    return 'Strong security with only minor predictable patterns.';
  }
  if (strengthCategory === 'Moderate' || predictabilityCategory.includes('High')) {
    return 'Needs Improvement\nGood complexity but contains predictable patterns.';
  }
  return 'High Risk\nWeak and highly predictable password.';
}

function renderSuggestions(listElement, messages) {
  listElement.innerHTML = messages.map((message) => `<li>${message}</li>`).join('');
}

function updateResults() {
  const password = passwordInput.value;
  const strengthScore = calculateStrength(password);
  const predictabilityScore = calculatePredictability(password);
  const strengthCategory = getStrengthCategory(strengthScore);
  const predictabilityCategory = getPredictabilityCategory(predictabilityScore);

  strengthScoreEl.textContent = `${strengthScore} / 100`;
  predictabilityScoreEl.textContent = `${predictabilityScore} / 100`;
  strengthCategoryEl.textContent = strengthCategory;
  predictabilityCategoryEl.textContent = predictabilityCategory;

  strengthProgress.style.width = `${strengthScore}%`;
  predictabilityProgress.style.width = `${predictabilityScore}%`;
  strengthProgress.style.background = getColorForScore(strengthScore);
  predictabilityProgress.style.background = getColorForScore(predictabilityScore, true);

  renderSuggestions(strengthSuggestionsEl, getStrengthMessages(strengthCategory));
  renderSuggestions(predictabilitySuggestionsEl, getPredictabilityMessages(predictabilityCategory));

  const healthSummary = getHealthSummary(strengthCategory, predictabilityCategory);
  healthSummaryEl.textContent = healthSummary;
}

passwordInput.addEventListener('input', () => {
  updateResults();
});

showPassword.addEventListener('change', () => {
  passwordInput.type = showPassword.checked ? 'text' : 'password';
});

analyzeBtn.addEventListener('click', () => {
  updateResults();
  document.getElementById('analyzer').scrollIntoView({ behavior: 'smooth' });
});

clearBtn.addEventListener('click', () => {
  passwordInput.value = '';
  strengthScoreEl.textContent = '0 / 100';
  predictabilityScoreEl.textContent = '0 / 100';
  strengthCategoryEl.textContent = 'Very Weak';
  predictabilityCategoryEl.textContent = 'Very Low Predictability';
  strengthProgress.style.width = '0%';
  predictabilityProgress.style.width = '0%';
  renderSuggestions(strengthSuggestionsEl, ['Enter a password to see guidance.']);
  renderSuggestions(predictabilitySuggestionsEl, ['Enter a password to see guidance.']);
  healthSummaryEl.textContent = 'Enter a password to receive a health summary.';
  showPassword.checked = false;
  passwordInput.type = 'password';
});

// Initialize with default messaging.
renderSuggestions(strengthSuggestionsEl, ['Enter a password to see guidance.']);
renderSuggestions(predictabilitySuggestionsEl, ['Enter a password to see guidance.']);
