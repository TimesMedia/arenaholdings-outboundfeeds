#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const env = args.includes('--prod') ? 'prod' : 'sandbox';
const baseDir = __dirname;
const paths = {
  prodSrc: path.join(baseDir, 'blocks-prod.json'),
  dest: path.join(baseDir, 'blocks.json'),
  backup: path.join(baseDir, 'blocks-backup.json'),
};

const fusionCmd = './node_modules/.bin/fusion';
const fusionArgs = ['zip'];

const fileExists = file => fs.existsSync(file);
const copyFile = (from, to) => fs.copyFileSync(from, to);
const removeFile = file => fileExists(file) && fs.unlinkSync(file);

const backupFile = () => {
  if (fileExists(paths.dest)) {
    copyFile(paths.dest, paths.backup);
    console.log('🗂️  Backed up blocks.json');
  }
};

const restoreFile = () => {
  if (fileExists(paths.backup)) {
    copyFile(paths.backup, paths.dest);
    removeFile(paths.backup);
    console.log('🔄 Restored original blocks.json');
  }
};

const replaceBlocksForProd = () => {
  backupFile();
  copyFile(paths.prodSrc, paths.dest);
  console.log('✅ Replaced blocks.json with blocks-prod.json');
};

const runFusionZip = () => {
  console.log('\n🚀 Running fusion zip...\n');
  const fusion = spawn(fusionCmd, fusionArgs, { shell: true });

  fusion.stdout.on('data', data => process.stdout.write(data));
  fusion.stderr.on('data', data => process.stderr.write(data));

  fusion.on('close', code => {
    console.log(`\n⚙️  fusion zip exited with code ${code}`);
    console.log('🟢 Done!');
    if (env === 'prod') restoreFile();
  });

  const handleExit = signal => {
    console.log(`\n⚠️  Received ${signal} — ${env === 'prod' ? 'restoring original blocks.json' : 'exiting'}`);
    if (env === 'prod') restoreFile();
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
};

if (env === 'prod') {
  replaceBlocksForProd();
} else {
  console.log('🟡 Sandbox mode — using blocks.json directly (no replacement)');
}

runFusionZip();
