export interface ScraperResult {
  date: string;
  topics: Topic[];
}

export interface Entry {
  body: string;
  ogMetadata?: OgMetadata;
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

export interface OgScraperResults {
  error: boolean;
  results: {
    ogDescription: string;
    ogImage: {
      height: string;
      type: string;
      url: string;
      width: string;
    };
    ogTitle: string;
    ogType: string;
    ogUrl: string;
    requestUrl: string;
    success: boolean;
  };
}

export interface OgMetadata {
  ogDescription: string;
  ogImage: {
    height: string;
    type: string;
    url: string;
    width: string;
  };
  ogTitle: string;
}
