const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const babel = require('@babel/core');

const sourceDir = 'node_modules/monaco-editor';
const bundleDir = 'assets/editor.bundle';
const destDir = `${bundleDir}/monaco-editor`;
const definitionFile = 'monaco.d.ts';

rimraf.sync(destDir);
fs.mkdirSync(destDir);

fs.copyFileSync(
  path.resolve(sourceDir, definitionFile),
  path.resolve(destDir, definitionFile),
);

function copyDir(dir, rewrite = true) {
  const copySourceDir = path.resolve(sourceDir, dir);
  const copyDestDir = path.resolve(destDir, dir);
  fs.mkdirSync(copyDestDir, {recursive: true});

  for (const entry of fs.readdirSync(copySourceDir)) {
    const fullEntryPath = path.resolve(copySourceDir, entry);
    const fsInfo = fs.statSync(fullEntryPath);

    if (fsInfo.isDirectory()) {
      copyDir(path.join(dir, entry), rewrite);
    } else {
      const destPath = path.resolve(copyDestDir, entry);
      console.log(`Processing: ${fullEntryPath} > ${destPath}`);

      // Make the js compatible with the Android Webview.
      if (rewrite && entry.endsWith('.js') && entry !== 'loader.js') {
        console.log('Transpiling');
        const res = babel.transformFileSync(fullEntryPath, {
          babelrc: false,
          configFile: false,
          plugins: [
            '@babel/plugin-proposal-nullish-coalescing-operator',
            [
              'transform-globals',
              {
                /* replace global variables */
                replace: {
                  fetch: 'WHATWGFetch.fetch',
                },
              },
            ],
          ],
        });
        let code = res.code;

        // Polyfill WHATWG Fetch inside web worker.
        if (entry === 'workerMain.js') {
          code =
            fs.readFileSync(
              path.resolve(bundleDir, 'whatwg-fetch.js'),
              'utf-8',
            ) + `\n\n${code}`;
        }

        fs.writeFileSync(destPath, code);
      } else {
        fs.copyFileSync(fullEntryPath, destPath);
      }
      console.log();
    }
  }
}

copyDir('dev/vs', false);
copyDir('min/vs');
