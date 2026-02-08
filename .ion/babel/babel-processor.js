/**
 * Babel Processor for Ion Compiler
 * Clones entire project structure to .ion-target/ and transforms JSX/TSX files
 */

const { transformAsync } = require('@babel/core');
const presetTypescript = require('@babel/preset-typescript');
const babelPluginSyntaxJsx = require('@babel/plugin-syntax-jsx');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const ionBabelPlugin = require('./ion-babel-plugin.js');

class BabelProcessor {
  constructor(rootDir = '.', targetDir = '.ion-target') {
    this.rootDir = rootDir;
    this.targetDir = targetDir;
    this.ignorePatterns = [
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
  }

  shouldIgnore(name, relativePath) {
    if (name.startsWith('.') && name !== '.env' && name !== '.env.local') {
      return this.ignorePatterns.some((p) => name === p);
    }
    return this.ignorePatterns.some((p) => name === p || relativePath.startsWith(p + path.sep));
  }

  shouldTransform(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.jsx' || ext === '.tsx';
  }

  async processFile(sourceFilePath) {
    try {
      const ext = path.extname(sourceFilePath).toLowerCase();
      const relativePath = path.relative(this.rootDir, sourceFilePath);
      const targetFilePath = path.join(this.targetDir, relativePath);
      const targetDirPath = path.dirname(targetFilePath);

      await mkdir(targetDirPath, { recursive: true });

      if (!this.shouldTransform(sourceFilePath)) {
        await copyFile(sourceFilePath, targetFilePath);
        return { transformed: false };
      }

      const code = await readFile(sourceFilePath, 'utf-8');

      const presets = [];
      if (ext === '.tsx' || ext === '.ts') {
        presets.push([presetTypescript, { isTSX: ext === '.tsx', allExtensions: true }]);
      }

      const result = await transformAsync(code, {
        filename: sourceFilePath,
        presets,
        plugins: [babelPluginSyntaxJsx, ionBabelPlugin],
        babelrc: false,
        configFile: false,
        sourceMaps: false,
        retainLines: true,
      });

      if (!result || !result.code) {
        throw new Error(`No code generated from ${sourceFilePath}`);
      }

      await writeFile(targetFilePath, result.code, 'utf-8');
      return { transformed: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { transformed: false, error: errorMessage };
    }
  }

  async deleteFile(sourceFilePath) {
    const relativePath = path.relative(this.rootDir, sourceFilePath);
    const targetFilePath = path.join(this.targetDir, relativePath);

    try {
      await unlink(targetFilePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async deleteDirectory(sourceDirPath) {
    const relativePath = path.relative(this.rootDir, sourceDirPath);
    const targetDirPath = path.join(this.targetDir, relativePath);

    try {
      await this.rmrf(targetDirPath);
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  async rmrf(dirPath) {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await this.rmrf(fullPath);
        } else {
          await unlink(fullPath);
        }
      }
      await rmdir(dirPath);
    } catch (error) {
      // Ignore if doesn't exist
    }
  }

  async processDirectory(dirPath) {
    if (!dirPath) {
      dirPath = this.rootDir;
    }

    const result = {
      processed: 0,
      copied: 0,
      errors: [],
    };

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);

        if (this.shouldIgnore(entry.name, relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          const targetDirPath = path.join(this.targetDir, relativePath);
          await mkdir(targetDirPath, { recursive: true });

          const subResult = await this.processDirectory(fullPath);
          result.processed += subResult.processed;
          result.copied += subResult.copied;
          result.errors.push(...subResult.errors);
        } else if (entry.isFile()) {
          const processResult = await this.processFile(fullPath);

          if (processResult.error) {
            result.errors.push(`${fullPath}: ${processResult.error}`);
          } else if (processResult.transformed) {
            result.processed++;
          } else {
            result.copied++;
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Directory ${dirPath}: ${errorMessage}`);
    }

    return result;
  }

  async clearTargetDirectory() {
    await this.rmrf(this.targetDir);
  }
}

module.exports = { BabelProcessor };

if (require.main === module) {
  const args = process.argv.slice(2);
  const processor = new BabelProcessor();

  async function main() {
    if (args[0] === 'process-file' && args[1]) {
      const filePath = args[1];
      console.log(`Processing single file: ${filePath}`);
      const result = await processor.processFile(filePath);
      if (result.error) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
      }
      console.log(result.transformed ? 'Transformed successfully' : 'Copied successfully');
    } else if (args[0] === 'clean') {
      console.log('Clearing .ion-target directory...');
      await processor.clearTargetDirectory();
      console.log('Done');
    } else {
      console.log('Processing project directory...');
      console.log('   Source: ./');
      console.log('   Target: .ion-target/');
      console.log('');
      const result = await processor.processDirectory();
      console.log(`Processed: ${result.processed} files transformed, ${result.copied} files copied`);
      if (result.errors.length > 0) {
        console.error('Errors:');
        result.errors.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }
    }
  }

  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
