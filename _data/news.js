import scraper from "../src/scraper";

/**
 * Expose live-scraped news entries as a news variable in templates.
 */
module.exports = async function () {
  const results = await scraper();
  return results;
};
