const start = Date.now();
fetch('https://rich-investor-news.com/api/og?title=latency_test&subtitle=speed')
    .then(res => {
        console.log('Status:', res.status);
        console.log('Time taken:', Date.now() - start, 'ms');
    })
    .catch(err => {
        console.error('Error:', err);
        console.log('Time taken before error:', Date.now() - start, 'ms');
    });
