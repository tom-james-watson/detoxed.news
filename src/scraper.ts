import axios from "axios";
import cheerio from "cheerio";
import ogScraper from "open-graph-scraper";
import { Entry, OgMetadata, ScraperResult, Tag, Topic } from "./types";

const BASE_URL = "https://en.wikipedia.org";

/**
 * Extract a Tag from an li element.
 */
function getTag(li: cheerio.Element): Tag {
  if (li.children[0].type === "tag") {
    return {
      name: li.children[0].attribs.title,
      url: `${BASE_URL}${li.children[0].attribs.href}`,
    };
  }

  let tagName = "";
  li.children.forEach((liChild: cheerio.Element): void => {
    if (liChild.type === "text") {
      tagName += liChild.data;
    } else if (liChild.type === "tag") {
      tagName += liChild.attribs.title;
    }
  });

  return {
    name: tagName,
  };
}

async function getOgMetadata(url: string): Promise<OgMetadata | undefined> {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  ) {
    // Don't want to fetch og metadata in tests, takes too long
    return {
      ogDescription: "Placeholder description",
      ogImage: {
        height: "100",
        type: "image/png",
        url:
          "https://upload.wikimedia.org/wikipedia/commons/3/33/Al_Jazeera_English_Doha_Newsroom_1.jpg",
        width: "100",
      },
      ogTitle: "Placeholder title",
    };
  }

  const { error, result, errorDetails } = await ogScraper({ url });

  if (error) {
    throw errorDetails;
  }

  console.log(`Got og metadata for ${url}`);

  return {
    ogDescription: result.ogDescription,
    ogImage: result.ogImage,
    ogTitle: result.ogTitle,
  };
}

/**
 * Extract an Entry from an li element.
 */
async function getEntry(li: cheerio.Element, tags: Tag[]): Promise<Entry> {
  let body = "";
  let url: string | undefined;
  let ogMetadata: OgMetadata | undefined;

  if (li.children) {
    for (let i = 0; i < li.children.length; i++) {
      const liChild = li.children[i];
      if (i === li.children.length - 1) {
        url = liChild.attribs.href;
        try {
          ogMetadata = await getOgMetadata(url);
        } catch (err) {
          console.warn("Failed to get og metadata:", err);
        }
        continue;
      }

      if (liChild.type === "text") {
        body += liChild.data;
        continue;
      }

      if (liChild.type === "tag") {
        body += liChild.attribs.title;
      }
    }
  }

  return {
    body,
    ogMetadata,
    tags,
    url,
  };
}

/**
 * Recursively extract entries from a ul element.
 *
 * The current events portal stores the entries in arbitrary nested ul
 * elements. If an li of a ul has a nested ul, it means the li should be
 * treated as another Tag to be added to the list of any child entries. li
 * elements without a nested ul are actual text items that need to each be
 * extracted into an Entry.
 */
async function getEntriesFromUl(
  ul: cheerio.Element,
  tags: Tag[]
): Promise<Entry[]> {
  const entries: Entry[] = [];

  for (const li of ul.children) {
    const childUl =
      li.children &&
      li.children.find((child: cheerio.Element): boolean => {
        return child.name === "ul";
      });

    if (childUl) {
      entries.push(...(await getEntriesFromUl(childUl, [...tags, getTag(li)])));
    } else {
      entries.push(await getEntry(li, tags));
    }
    debugger;
  }

  return entries;
}

/**
 * Extract entries from a day element.
 *
 * A day is made up of a series of div headerd and ul lists. When we encounter
 * a new div, that sets the topic for the following ul. We add the entries
 * extracted from each ul to the current topic.
 */
async function getEntriesForDay(
  $: cheerio.Root,
  day: cheerio.Element
): Promise<ScraperResult> {
  const date = day.attribs["aria-label"];

  const topLevelItems = $(".description", day).children().toArray();

  const topicMap: {
    [topicName: string]: Entry[];
  } = {};

  let topicName = "";
  for (const topLevelItem of topLevelItems) {
    if (
      topLevelItem.name === "div" &&
      typeof topLevelItem.children[0].data === "string"
    ) {
      topicName = topLevelItem.children[0].data;
      console.log(`Getting entries for ${date} / ${topicName}`);
    } else if (
      topLevelItem.name === "ul" &&
      // When the date is first added, it exists as an empty ul, which we
      // need to ignore.
      topLevelItem.children[0].attribs.class !== "mw-empty-elt"
    ) {
      if (!topicMap[topicName]) {
        topicMap[topicName] = [];
      }
      topicMap[topicName].push(...(await getEntriesFromUl(topLevelItem, [])));
    }
  }

  const topics: Topic[] = Object.keys(topicMap).map(
    (topicName: string): Topic => {
      return {
        name: topicName,
        entries: topicMap[topicName],
      };
    }
  );

  return {
    date,
    topics,
  };
}

export default async function scrapeEntries(): Promise<ScraperResult[]> {
  const res = await axios.get(
    "https://en.wikipedia.org/wiki/Portal:Current_events"
  );

  const $ = cheerio.load(res.data);

  const days = $(".vevent").toArray();

  const results: ScraperResult[] = [];

  for (const day of days) {
    const result = await getEntriesForDay($, day);
    if (Object.keys(result.topics).length > 0) {
      results.push(result);
    }
  }

  return results;
}
