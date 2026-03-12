async function check() {
    const text = "投資家";
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const css = await res.text();
    console.log(css);
    const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype|woff2|woff)'\)/);
    console.log("Match:", resource ? resource[1] : "NULL");
}
check();
