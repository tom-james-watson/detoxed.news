declare module "precss";

declare module "open-graph-scraper" {
  export default function (options: {
    url: string;
  }): Promise<{
    error: boolean;
    errorDetails?: Error;
    result: {
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
  }>;
}
