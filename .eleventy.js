const path = require("path");
const postcss = require("postcss");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addFilter("parseWikiDate", function(s) {
    year = new Date(Date.now()).getFullYear();
    return new Date(Date.parse(s + ", " + year));
  });
  eleventyConfig.addFilter("makeEntryTitle", function(entry) {
    if (entry.ogMetadata) {
      if (entry.ogMetadata.ogTitle) {
        return entry.ogMetadata.ogTitle;
      }
      if (entry.ogMetadata.ogDescription) {
        return entry.ogMetadata.ogDescription;
      }
    }
    if (entry.tags.length > 0) {
      return entry.tags[0].name;
    }
    return "No title";
  });
  eleventyConfig.addPairedShortcode("postcss", async (code) => {
    // for relative path CSS imports
    const filepath = path.join(__dirname, "_includes/style.css");

    return await postcss([
      // PostCSS plugins
      require("postcss-import"),
      require("precss"),
      require("autoprefixer"),
      require("cssnano"),
    ])
      .process(code, { from: filepath })
      .then((result) => result.css);
  });
};

require("ts-node").register({
  project: "tsconfig.json",
  files: "src/global.d.ts",
});
