
export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source?: string;
}

class NewsService {
    private RSS_TO_JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';
    private BBC_FEED = 'https://feeds.bbci.co.uk/news/world/rss.xml';

    async fetchTopHeadlines(): Promise<NewsItem[]> {
        try {
            const response = await fetch(`${this.RSS_TO_JSON}${this.BBC_FEED}`);
            const data = await response.json();

            if (data.items) {
                return data.items.slice(0, 5).map((item: any) => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source: 'BBC News'
                }));
            }
            return [];
        } catch (error) {
            console.error('News Service Error:', error);
            return [];
        }
    }
}

export const newsService = new NewsService();
