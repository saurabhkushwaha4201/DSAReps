/**
 * Calculates the next review date and new SRS parameters based on the rating.
 * Rating: 'AGAIN', 'HARD', 'GOOD', 'EASY'
 * Algorithm inspired by Anki / SuperMemo-2
 */
const calculateSRS = (currentInterval, currentEase, rating) => {
  let newInterval;
  let newEase = currentEase;

  if (rating === 'AGAIN') {
    newInterval = 1; // Reset to 1 day (or very short)
    newEase = Math.max(1.3, currentEase - 0.2);
  } else if (rating === 'HARD') {
    newInterval = Math.max(1, Math.floor(currentInterval * 1.2));
    newEase = Math.max(1.3, currentEase - 0.15);
  } else if (rating === 'GOOD') {
    newInterval = Math.max(1, Math.floor(currentInterval * currentEase));
    // Ease remains same or slight adjustment? Standard SM-2 doesn't change ease on good much usually, 
    // but sometimes it does. Let's keep it simple: Only update ease on 'EASY' or failures.
    // Actually, prompts says "Calculate new Interval/Ease". I'll use a standard formula.
    // SM-2: EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02)) where q is quality 0-5.
    // Mapping: AGAIN=0/1, HARD=3, GOOD=4, EASY=5
    // Let's stick to a simplified version for robustness if not specified.

    // Using a simplified logic:
  } else if (rating === 'EASY') {
    newInterval = Math.max(1, Math.floor(currentInterval * currentEase * 1.3)); // Bonus multiplier
    newEase = currentEase + 0.15;
  }

  // Fallback for initial 'GOOD'
  if (rating === 'GOOD' && currentInterval === 0) newInterval = 1;

  return {
    interval: newInterval,
    easeFactor: newEase,
    nextReviewDate: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000)
  };
};

module.exports = {
  calculateSRS,
};
