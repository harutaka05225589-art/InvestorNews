async function test() {
    const url = 'https://rich-investor-news.com/api/og?type=investors';
    console.log('Fetching:', url);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Twitterbot/1.0' } });
        console.log('Status:', res.status);
        console.log('Headers:');
        for (const [key, value] of res.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
