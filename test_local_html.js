async function test() {
    const url = 'http://localhost:3000/revisions/541';
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Twitterbot/1.0' } });
        const html = await res.text();
        const tags = html.match(/<meta[^>]+twitter:[^>]+>/gi) || [];
        const ogTags = html.match(/<meta[^>]+opemGraph:[^>]+>/gi) || [];
        const ogTags2 = html.match(/<meta[^>]+og:[^>]+>/gi) || [];
        console.log('--- TWITTER TAGS ---');
        tags.forEach(t => console.log(t));
        console.log('--- OG TAGS ---');
        ogTags2.forEach(t => console.log(t));
    } catch (e) {
        console.error(e);
    }
}
test();
