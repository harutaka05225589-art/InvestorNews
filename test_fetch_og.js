const fs = require('fs');
async function test() {
    console.log("Fetching image...");
    const res = await fetch('https://rich-investor-news.com/api/og?type=investors');
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const buffer = await res.arrayBuffer();
    console.log('Size:', buffer.byteLength, 'bytes');
    fs.writeFileSync('test_og.png', Buffer.from(buffer));
    console.log('Saved to test_og.png');
}
test();
