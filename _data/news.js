import scraper from "../src/scraper";

module.exports = async function () {
  const results = await scraper();
  return results;
};
