const fs = require("fs");
const path = require("path");

const root = __dirname;

const templatePath = path.join(root,"src","index.template.html");

const outputPath = path.join(root,"index.html");

let html = fs.readFileSync(templatePath,"utf8");

html = html.replace(
    /<!--\s*@include\s+(.+?)\s*-->/g,
    (match, filePath) => {
        const fullPath = path.join(root,"src",filePath.trim());
        return fs.readFileSync(fullPath,"utf8");
    }
);

fs.writeFileSync(outputPath,html,"utf8");
