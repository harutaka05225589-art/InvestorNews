async function check() {
    const res = await fetch('https://rich-investor-news.com/robots.txt');
    console.log('Status:', res.status);
    console.log(await res.text());
}
check();
