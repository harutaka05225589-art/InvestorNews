async function checkOG() {
    try {
        const res = await fetch('https://rich-investor-news.com/api/og?title=test&subtitle=test');
        console.log('Status:', res.status);
        console.log('Headers:', res.headers);
        if (!res.ok) {
            const text = await res.text();
            console.log('Body:', text.substring(0, 500));
        } else {
            console.log('Success: Image received');
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
checkOG();
