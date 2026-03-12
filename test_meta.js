async function test() {
    const res = await fetch('https://rich-investor-news.com/introduction?v=4');
    const text = await res.text();
    const tags = text.match(/<meta[^>]*twitter:image[^>]*>/gi);
    console.log('--- TWITTER TAGS ---');
    console.log(tags);
    const ogTags = text.match(/<meta[^>]*og:image[^>]*>/gi);
    console.log('--- OG TAGS ---');
    console.log(ogTags);
}
test();
