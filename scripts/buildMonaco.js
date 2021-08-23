const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const babel = require('@babel/core');

const monacoDir = 'node_modules/monaco-editor';
const bundleDir = 'assets/editor.bundle';
const destDir = `${bundleDir}/monaco-editor`;
const definitionFile = 'monaco.d.ts';

const packageInfo = JSON.parse(
  fs.readFileSync(path.resolve(monacoDir, 'package.json'), 'utf-8'),
);
console.log(`Monaco Version: ${packageInfo.version}`);

rimraf.sync(destDir);
fs.mkdirSync(destDir);

fs.copyFileSync(
  path.resolve(monacoDir, definitionFile),
  path.resolve(destDir, definitionFile),
);

function copyDir(source, dest, transpile = true) {
  const copySourceDir = path.resolve('node_modules', source);
  const copyDestDir = path.resolve(destDir, dest);
  fs.mkdirSync(copyDestDir, {recursive: true});

  for (const entry of fs.readdirSync(copySourceDir)) {
    const fullEntryPath = path.resolve(copySourceDir, entry);
    const fsInfo = fs.statSync(fullEntryPath);

    if (fsInfo.isDirectory()) {
      copyDir(path.join(source, entry), path.join(dest, entry), transpile);
    } else {
      const destPath = path.resolve(copyDestDir, entry);
      console.log(`Processing: ${fullEntryPath} > ${destPath}`);

      // Make the js compatible with the Android Webview.
      if (transpile && entry.endsWith('.js') && entry !== 'loader.js') {
        console.log('Transpiling');
        const res = babel.transformFileSync(fullEntryPath, {
          babelrc: false,
          configFile: false,
          presets: ['@babel/env'],
          plugins: [
            [
              '@babel/plugin-transform-runtime',
              {
                regenerator: true,
                helpers: false,
              },
            ],
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

        // Inline the regenerator runtime
        const _regeneratorLoader =
          '_interopRequireDefault(require("@babel/runtime/regenerator"));';
        if (code.includes(_regeneratorLoader)) {
          console.log('Inlining Regenerator Runtime');

          code =
            fs.readFileSync(
              'node_modules/regenerator-runtime/runtime.js',
              'utf-8',
            ) + `\n\n${code}`;
          code = code.replace(
            _regeneratorLoader,
            '{default:regeneratorRuntime};',
          );
        }

        // Polyfill WHATWG Fetch inside web worker.
        if (entry === 'workerMain.js') {
          console.log('Inlining WHATWG Fetch');

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

copyDir('monaco-editor/min/vs', 'min/vs', true);

fs.writeFileSync(
  path.resolve(destDir, 'info.js'),
  `var _monacoInfo = ${JSON.stringify(packageInfo, null, 2)};`,
);
