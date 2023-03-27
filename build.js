const chokidar = require('chokidar');
const esbuild = require("esbuild");
const sass = require("sass");
const fs = require("fs/promises");

chokidar.watch("./scripts").on("all", async (event, path) => {
    await esbuild.build({
        entryPoints: ["scripts/main.js"],
        bundle: true,
        outfile: "out/out.js",
    });

    console.log("Built JavaScript");
});

chokidar.watch("./style").on("all", async (event, path) => {
    const result = await sass.compile("style/main.sass");
    await fs.writeFile("out/main.css", result.css);
    console.log("Built CSS");
});
