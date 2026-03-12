async function test() {
    const url = 'https://rich-investor-news.com/introduction?v=6';
    console.log('Fetching:', url);
    const res = await fetch(url, { headers: { 'User-Agent': 'Twitterbot/1.0' } });
    const html = await res.text();

    const tags = html.match(/<meta[^>]+twitter:[^>]+>/gi) || [];
    const ogTags = html.match(/<meta[^>]+og:[^>]+>/gi) || [];

    console.log('--- TWITTER TAGS ---');
    tags.forEach(t => console.log(t));
    console.log('--- OG TAGS ---');
    ogTags.forEach(t => console.log(t));
}
test();
