const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const build = spawnSync(process.execPath, [path.join(root, "build.js")], { stdio: "inherit" });
if (build.status !== 0)
    process.exit(build.status || 1);
function version(relativePath) {
    const file = path.join(root, relativePath.replace(/^\.\//, ""));
    return crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 10);
}
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace("<head>", '<head>\n    <base href="../">');
html = html.replace("</head>", '    <link rel="stylesheet" href="./tests/visual-test.css?v=' + version("./tests/visual-test.css") + '">\n</head>');
html = html.replace("</body>", '    <script src="./tests/visual-test.js?v=' + version("./tests/visual-test.js") + '"></script>\n    <script src="./tests/cases.js?v=' + version("./tests/cases.js") + '"></script>\n</body>');
fs.writeFileSync(path.join(__dirname, "index.html"), html, "utf8");
console.log("Built tests/index.html");
