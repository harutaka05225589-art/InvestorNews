async function test() {
    const url = 'https://rich-investor-news.com/api/og.png?type=investors';
    console.log('Fetching:', url);
    const res = await fetch(url, { headers: { 'User-Agent': 'Twitterbot/1.0' } });
    console.log('Status:', res.status);
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
        console.log(`  ${key}: ${value}`);
    }
}
test();
