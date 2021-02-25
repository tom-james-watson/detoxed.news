import axios from "axios";
import cheerio from "cheerio";
import ogScraper from "open-graph-scraper";
import {
  Entry,
  EntryPart,
  OgMetadata,
  ScraperResult,
  Tag,
  Topic,
} from "./types";
import shuffle from "./shuffle";

const BASE_URL = "https://en.wikipedia.org";

/**
 * Extract a Tag from an li element.
 */
function getTags(li: cheerio.Element): Tag[] {
  return li.children
    .filter((child: cheerio.Element): boolean => {
      return child.name === "a";
    })
    .map(
      (child: cheerio.Element): Tag => {
        return {
          name: child.attribs.title,
          url: `${BASE_URL}${child.attribs.href}`,
        };
      }
    );
}

async function getOgMetadata(url: string): Promise<OgMetadata | undefined> {
  if (process.env.NODE_ENV === "test") {
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

  if (!result.ogImage.url) {
    throw new Error("Unable to find ogImage");
  }

  // Check whether image can be hotlinked. If you don't want your image to be
  // hotlinked, why do you put it in your open graph metadata...
  const res = await axios.get(result.ogImage.url, {
    // Placeholder till we get a domain
    headers: {
      Referer: "https://wikipedia.org",
    },
  });

  if (res.status !== 200) {
    throw new Error("ogImage unreachable");
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
async function getEntry(
  li: cheerio.Element,
  tags: Tag[],
  withOg: boolean
): Promise<Entry> {
  const body: EntryPart[] = [];
  let url: string | undefined;
  let sourceName: string | undefined;
  let ogMetadata: OgMetadata | undefined;

  if (li.children) {
    for (let i = 0; i < li.children.length; i++) {
      const liChild = li.children[i];
      if (i === li.children.length - 1 && liChild.type === "tag") {
        url = liChild.attribs.href;
        // Sometimes the article link is plain text, sometimes it's
        // (<i>text</i>).
        if (liChild.children.length === 1) {
          sourceName = liChild.children[0].data
            ? liChild.children[0].data.replace(/[()]/g, "")
            : undefined;
        } else {
          sourceName = liChild.children[1].children[0].data
            ? liChild.children[1].children[0].data.replace(/[()]/g, "")
            : undefined;
        }

        if (withOg) {
          try {
            ogMetadata = await getOgMetadata(url);
          } catch (err) {
            console.log({ url });
            console.warn("Failed to get og metadata:", err);
          }
        }
        continue;
      }

      if (liChild.type === "text") {
        body.push({
          type: "plain",
          text: liChild.data as string,
        });
        continue;
      }

      if (liChild.type === "tag" && liChild.attribs.title) {
        body.push({
          type: "link",
          text: liChild.children[0].data as string,
          title: liChild.attribs.title,
          url: `${BASE_URL}${liChild.attribs.href}`,
        });
      }
    }
  }

  return {
    body,
    ogMetadata,
    sourceName,
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
  tags: Tag[],
  withOg: boolean
): Promise<Entry[]> {
  const entries: Entry[] = [];

  // There's enough coverage of this elsewhere, plus this generally generates
  // too many entries. Let's save readers from covid-overload.
  if (tags.some((tag) => tag.name === "COVID-19 pandemic")) {
    return entries;
  }

  for (const li of ul.children) {
    if (li.type === "text") {
      continue;
    }

    const childUl =
      li.children &&
      li.children.find((child: cheerio.Element): boolean => {
        return child.name === "ul";
      });

    if (childUl) {
      entries.push(
        ...(await getEntriesFromUl(childUl, [...tags, ...getTags(li)], withOg))
      );
    } else {
      entries.push(await getEntry(li, tags, withOg));
    }
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
  day: cheerio.Element,
  withOg: boolean
): Promise<ScraperResult> {
  const date = day.attribs["aria-label"];

  const topLevelItems = $(".description", day).children().toArray();

  const topicMap: {
    [topicName: string]: Entry[];
  } = {};

  let topicName = "";
  for (const topLevelItem of topLevelItems) {
    if (
      topLevelItem.name === "p" &&
      topLevelItem.children[0].name === "b" &&
      typeof topLevelItem.children[0].children[0].data === "string"
    ) {
      topicName = topLevelItem.children[0].children[0].data;
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
      topicMap[topicName].push(
        ...(await getEntriesFromUl(topLevelItem, [], withOg))
      );
    }
  }

  const topics: Topic[] = Object.keys(topicMap)
    .filter((topicName: string): boolean => {
      return topicMap[topicName].length > 0;
    })
    .map(
      (topicName: string): Topic => {
        return {
          name: topicName,
          entries: topicMap[topicName],
        };
      }
    );

  // Randomize the order of the topics. Wikipedia is just alphabetical and
  // maybe it gets boring to always read about Armed conflicts and attacks
  // first.
  shuffle(topics);

  return {
    date,
    topics,
  };
}

/**
 * Scrape news entries from the wikipedia current events portal.
 */
export default async function scrapeEntries(): Promise<ScraperResult[]> {
  const res = await axios.get(
    "https://en.wikipedia.org/wiki/Portal:Current_events"
  );

  const $ = cheerio.load(res.data);

  // Get the last 3 days of entries.
  const days = $(".vevent").toArray().slice(0, 4);

  const results: ScraperResult[] = [];

  let withOg = true;
  let imageEntries = 0;

  for (const day of days) {
    const result = await getEntriesForDay($, day, withOg);

    if (Object.keys(result.topics).length > 0) {
      results.push(result);

      for (const topic of result.topics) {
        for (const entry of topic.entries) {
          if (entry.ogMetadata) {
            imageEntries += 1;
          }
        }
      }

      if (imageEntries >= 5) {
        withOg = false;
      }
    }
  }

  return results;
}
