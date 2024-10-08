const fs = require("fs");
const { DateTime } = require("luxon");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItDeflist = require("markdown-it-deflist");
const markdownItMark = require("markdown-it-mark");
var QRCode = require("qrcode");

module.exports = function (eleventyConfig) {
  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  // Filters
  eleventyConfig.addFilter("qrCode", function (post) {
    const url = "https://nathan-long.com/rules" + post.url;
    const qrCode = QRCode.toString(
      url,
      {
        type: "svg",
      },
      function (err) {
        if (err) throw err;
      },
    );
    return qrCode;
  });

  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(
      format || "dd LLLL yyyy",
    );
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  // Return all the tags used in a collection
  eleventyConfig.addFilter("getAllTags", (collection) => {
    let tagSet = new Set();
    for (let item of collection) {
      (item.data.tags || []).forEach((tag) => tagSet.add(tag));
    }
    return Array.from(tagSet);
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(
      (tag) => ["all", "nav", "post", "posts"].indexOf(tag) === -1,
    );
  });

  eleventyConfig.addFilter("unique", function uniqueFromArray(tags) {
    return (tags || []).filter(
      (value, index, array) => array.indexOf(value) === index,
    );
  });

  // Tools is an array of filePathStems, return all that match
  // https://www.raymondcamden.com/2021/09/24/creating-a-manual-related-posts-feature-in-eleventy
  eleventyConfig.addFilter("getTools", function (tools, all) {
    return all.filter((p) => {
      return tools.includes(p.filePathStem);
    });
  });

  // Customize Markdown library and settings:
  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib
      .use(markdownItAnchor, {
        permalink: markdownItAnchor.permalink.ariaHidden({
          placement: "after",
          class: "header-anchor",
          symbol: "#",
          ariaHidden: false,
        }),
        level: [1, 2, 3, 4],
        slugify: eleventyConfig.getFilter("slugify"),
      })
      .use(markdownItDeflist)
      .use(markdownItMark);
  });

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync("_site/404.html");

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
  });

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: ["md", "njk", "html", "liquid"],

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: "njk",

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: "njk",

    // These are all optional:
    dir: {
      input: "content", // default: "."
      includes: "../_includes", // default: "_includes"
      data: "../_data", // default: "_data"
      output: "_site",
    },

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: "/",
  };
};
