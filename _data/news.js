const scraper = require("../src/scraper").default;

/**
 * Expose live-scraped news entries as a news variable in templates.
 */
module.exports = async function () {
  const results = await scraper();
  return results;
};
