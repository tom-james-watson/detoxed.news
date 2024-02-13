import scraper from "../src/scraper";
import { describe, expect, it } from "vitest";

describe("scraper", () => {
  it("should scrape entries", async () => {
    const results = await scraper();

    // console.log(JSON.stringify(results, null, 2));

    expect(results.length).toBeGreaterThanOrEqual(3);

    const result = results[0];
    expect(typeof result.date).toEqual("string");
    expect(result.topics.length).toBeGreaterThan(0);

    const topic = result.topics[0];
    expect(topic.entries.length).toBeGreaterThan(0);
    expect(typeof topic.name).toEqual("string");
    expect(topic.name).not.toEqual("");

    const story = topic.entries[0];
    expect(Array.isArray(story.body)).toEqual(true);
    expect(story.body).not.toEqual("");
    expect(story.tags.length).toBeGreaterThanOrEqual(0);
    if (story.tags.length > 0) {
      expect(typeof story.tags[0].name).toEqual("string");
      expect(story.tags[0].name).not.toEqual("");
    }
    expect(story.ogMetadata).toEqual({
      ogDescription: "Placeholder description",
      ogImage: {
        height: "100",
        type: "image/png",
        url:
          "https://upload.wikimedia.org/wikipedia/commons/3/33/Al_Jazeera_English_Doha_Newsroom_1.jpg",
        width: "100",
      },
      ogTitle: "Placeholder title",
    });
  });
});
