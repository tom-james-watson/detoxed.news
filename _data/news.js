import scraper from "../src/scraper";

module.exports = async function () {
  const results = await scraper();
  console.log(JSON.stringify(results, null, 2));
  return results;
};
