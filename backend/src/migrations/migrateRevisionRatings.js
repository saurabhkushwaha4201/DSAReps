const RevisionLog = require('../modules/revisions/revision.model');

const LEGACY_RATING_MAP = {
  AGAIN: 'FORGOT',
  HARD: 'SLOW',
  GOOD: 'CLEAN',
  EASY: 'CLEAN',
};

const migrateLegacyRevisionRatings = async () => {
  const bulkOperations = Object.entries(LEGACY_RATING_MAP).map(([legacyRating, nextRating]) => ({
    updateMany: {
      filter: { rating: legacyRating },
      update: { $set: { rating: nextRating } },
    },
  }));

  const result = await RevisionLog.bulkWrite(bulkOperations, { ordered: false });
  const modifiedCount = result.modifiedCount || 0;

  if (modifiedCount > 0) {
    console.log(`[Migration] Updated ${modifiedCount} legacy revision ratings to the new enum.`);
  }
};

module.exports = {
  LEGACY_RATING_MAP,
  migrateLegacyRevisionRatings,
};
