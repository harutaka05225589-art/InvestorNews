async function test() {
    const res = await fetch('https://rich-investor-news.com/api/og?title=test', {
        headers: { 'User-Agent': 'Twitterbot/1.0' }
    });
    console.log('Status:', res.status);
    const buffer = await res.arrayBuffer();
    console.log('Size:', buffer.byteLength, 'bytes');
}
test();
