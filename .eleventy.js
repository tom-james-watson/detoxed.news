const path = require("path");
const postcss = require("postcss");

module.exports = function (eleventyConfig) {
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
