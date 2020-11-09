# [detoxed.news](https://detoxed.news) | The important news, without the toxicity

## The Why

I try stay informed about current events and important world affairs, but I find the modern always-on, always-dramatic news cycle both tiring and anxiety-inducing. The news industry has an incentive to keep readers coming back - the more time they spend on their sites, the more ad-revenue they can generate. This tends to lead to addiction-forming UX, clickbait, over-dramatization and all-round information overload for the user.

Most news I end up reading ends up being either uninformative speculation or unnecessary tweeted-to-the-minute drama, neither of which are truly worth my time and energy.

What I would like is to stay informed, but in the least draining way possible.

## The How

A fantastic source for a balanced, low-drama summary of news is the [Wikipedia Current Events Portal](https://en.wikipedia.org/wiki/Portal:Current_events). It is a user-curated list of current events per day, with items being tagged under a series of nested categories.

https://detoxed.news scrapes this page, collating the entries and associating them with their categories, which are treated as "tags", and the linked source article. Whilst the Current Events Portal is informative, it's extremely text-heavy and a bit of a chore to read. https://detoxed.news attempts to prevent this same information in a more user-friendly and digestable way.

## Development

Install dependencies:

```bash
npm i
```

Run in development mode, with live reloading:

```bash
npm run dev
```
