const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const root = __dirname;
const templatePath = path.join(root, "src", "index.template.html");
const outputPath = path.join(root, "index.html");
function hashFile(relativePath) {
    const file = path.join(root, relativePath.replace(/^\.\//, ""));
    if (!fs.existsSync(file))
        return null;
    return crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 10);
}
function versionAssets(html) {
    return html.replace(/((?:src|href)=["'])(\.\/(?:assets|tests)\/[^"'?]+\.(?:js|css|png|webp|svg))(?:\?v=[^"']*)?(["'])/gi, (match, prefix, filePath, suffix) => {
        const hash = hashFile(filePath);
        return hash ? prefix + filePath + "?v=" + hash + suffix : match;
    });
}
let html = fs.readFileSync(templatePath, "utf8");
html = html.replace(/<!--\s*@include\s+(.+?)\s*-->/g, (match, filePath) => {
    const fullPath = path.join(root, "src", filePath.trim());
    return fs.readFileSync(fullPath, "utf8");
});
html = versionAssets(html);
fs.writeFileSync(outputPath, html, "utf8");
