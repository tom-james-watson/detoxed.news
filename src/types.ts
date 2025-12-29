export interface ScraperResult {
  date: string;
  topics: Topic[];
}

export interface EntryPart {
  type: "plain" | "link";
  text: string;
  title?: string;
  url?: string;
}

export interface Entry {
  body: EntryPart[];
  sourceName?: string;
  tags: Tag[];
  url?: string;
}

export interface Tag {
  name: string;
  url?: string;
}

export type Topic = {
  entries: Entry[];
  name: string;
};
