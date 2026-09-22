const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const build = spawnSync(process.execPath, [path.join(root, "build.js")], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status || 1);

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace("<head>", '<head>\n    <base href="../">');
html = html.replace("</head>", '    <link rel="stylesheet" href="./tests/visual-test.css?v=20260922-ingame-menu1">\n</head>');
html = html.replace("</body>", '    <script src="./tests/visual-test.js?v=20260922-ingame-menu1"></script>\n    <script src="./tests/cases.js?v=20260922-ingame-menu1"></script>\n</body>');
const output = path.join(__dirname, "index.html");
fs.writeFileSync(output, html, "utf8");
console.log("Built tests/index.html");
