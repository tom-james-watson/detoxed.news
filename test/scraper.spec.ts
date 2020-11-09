import scraper from "../src/scraper";

describe("scraper", () => {
  it("should scrape entries", async () => {
    const results = await scraper();

    // console.log(JSON.stringify(results, null, 2));

    expect(results.length).toEqual(4);

    const result = results[0];
    expect(typeof result.date).toEqual("string");
    expect(result.topics.length).toBeGreaterThan(0);

    const topic = result.topics[0];
    expect(topic.entries.length).toBeGreaterThan(0);

    const story = topic.entries[0];
    expect(typeof story.body).toEqual("string");
    expect(story.tags.length).toBeGreaterThanOrEqual(0);
    expect(typeof story.tags[0].name).toEqual("string");
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
