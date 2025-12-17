/**
 * Ion Watch Script
 * Watches entire project for changes and syncs to .ion-target/
 * Transforms JSX/TSX files, copies everything else
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const { BabelProcessor } = require('../babel/babel-processor.js');

const processor = new BabelProcessor('.', '.ion-target');

let debounceTimer = null;
const DEBOUNCE_MS = 100;

const pendingOperations = new Map();

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.ion',
  '.ion-target',
  '.next',
  '.nuxt',
  'dist',
  'build',
  '.cache',
  '.turbo',
  '.vercel',
  '.output',
];

function shouldIgnore(filePath) {
  const parts = filePath.split(path.sep);
  return parts.some((part) => IGNORE_PATTERNS.includes(part));
}

function scheduleProcess(filePath, operation) {
  if (shouldIgnore(filePath)) {
    return;
  }

  pendingOperations.set(filePath, operation);

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const operations = new Map(pendingOperations);
    pendingOperations.clear();

    for (const [file, op] of operations) {
      try {
        if (op === 'delete') {
          console.log(`🗑️  Removing ${file} from .ion-target...`);
          await processor.deleteFile(file);
          console.log(`✅ Removed ${file}`);
        } else if (op === 'deleteDir') {
          console.log(`🗑️  Removing directory ${file} from .ion-target...`);
          await processor.deleteDirectory(file);
          console.log(`✅ Removed directory ${file}`);
        } else {
          console.log(`🔨 Processing ${file}...`);
          const result = await processor.processFile(file);
          if (result.error) {
            console.error(`❌ Failed to process ${file}: ${result.error}`);
          } else {
            const action = result.transformed ? 'Transformed' : 'Copied';
            console.log(`✅ ${action} ${file}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message || error);
      }
    }
  }, DEBOUNCE_MS);
}

async function initialCompilation() {
  console.log('🔨 Running initial compilation...');
  console.log('   Source: ./');
  console.log('   Target: .ion-target/');
  console.log('');

  try {
    const result = await processor.processDirectory();

    console.log('');
    console.log(`✅ Initial compilation complete!`);
    console.log(`   Transformed: ${result.processed} files`);
    console.log(`   Copied: ${result.copied} files`);

    if (result.errors.length > 0) {
      console.log('');
      console.log('⚠️  Errors during compilation:');
      result.errors.forEach((e) => console.log(`   - ${e}`));
    }

    return true;
  } catch (error) {
    console.error('❌ Initial compilation failed:', error.message || error);
    return false;
  }
}

function startWatcher() {
  console.log('');
  console.log('👀 Watching project for changes...');
  console.log('');

  const watcher = chokidar.watch('.', {
    ignored: [
      /(^|[\/\\])\../, // Hidden files (but we handle .env specially)
      /node_modules/,
      /\.ion-target/,
      /\.ion(?![\/\\])/,
      /\.git/,
      /\.next/,
      /\.nuxt/,
      /dist(?![\/\\])/,
      /build(?![\/\\])/,
      /\.cache/,
      /\.turbo/,
      /\.vercel/,
      /\.output/,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 10,
    },
  });

  watcher
    .on('add', (filePath) => {
      if (!shouldIgnore(filePath)) {
        console.log(`➕ File added: ${filePath}`);
        scheduleProcess(filePath, 'add');
      }
    })
    .on('change', (filePath) => {
      if (!shouldIgnore(filePath)) {
        console.log(`📝 File changed: ${filePath}`);
        scheduleProcess(filePath, 'change');
      }
    })
    .on('unlink', (filePath) => {
      if (!shouldIgnore(filePath)) {
        console.log(`➖ File removed: ${filePath}`);
        scheduleProcess(filePath, 'delete');
      }
    })
    .on('addDir', async (dirPath) => {
      if (!shouldIgnore(dirPath) && dirPath !== '.') {
        const targetPath = path.join('.ion-target', dirPath);
        try {
          await fs.promises.mkdir(targetPath, { recursive: true });
        } catch (error) {
          // Ignore if already exists
        }
      }
    })
    .on('unlinkDir', (dirPath) => {
      if (!shouldIgnore(dirPath)) {
        console.log(`📁 Directory removed: ${dirPath}`);
        scheduleProcess(dirPath, 'deleteDir');
      }
    })
    .on('error', (error) => {
      console.error('❌ Watcher error:', error);
    })
    .on('ready', () => {
      console.log('✅ Watcher ready');
    });

  process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Stopping watcher...');
    watcher.close().then(() => {
      console.log('👋 Goodbye!');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    watcher.close().then(() => {
      process.exit(0);
    });
  });
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🚀 Ion Compiler Watch System');
  console.log('═══════════════════════════════════════════');
  console.log('');

  const success = await initialCompilation();

  if (!success) {
    console.log('');
    console.log('⚠️  Initial compilation had errors, but continuing to watch...');
  }

  startWatcher();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
