async function test() {
    const url = 'https://rich-investor-news.com/api/og?title=' + encodeURIComponent('非常に長いデバッグテキスト'); // Force long font fetch
    console.log('Fetching:', url);
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        const buffer = await res.arrayBuffer();
        console.log('Size:', buffer.byteLength, 'bytes');
    } catch (e) {
        console.error(e);
    }
}
test();
