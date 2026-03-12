async function check() {
    const res = await fetch('https://rich-investor-news.com/introduction');
    const text = await res.text();
    const metaLines = text.match(/<meta[^>]*(og:image|twitter:image)[^>]*>/gi);
    console.log('Found Meta Tags:');
    console.log(metaLines);
}
check();
