const fs = require('fs');

async function check() {
    const url = 'https://rich-investor-news.com/api/og?type=investors';
    console.log('Fetching:', url);
    const start = Date.now();
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Twitterbot/1.0',
            'Accept': '*/*'
        }
    });
    console.log('Time:', Date.now() - start, 'ms');
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));

    if (res.ok) {
        const buffer = await res.arrayBuffer();
        console.log('Size:', buffer.byteLength, 'bytes');
    } else {
        console.log('Text:', await res.text());
    }
}

check();
