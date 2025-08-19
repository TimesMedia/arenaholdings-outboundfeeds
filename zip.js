const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// Get the environment argument ('prod' or 'sandbox')
const env = process.argv[2]

if (!env || (env !== 'prod' && env !== 'sandbox')) {
  console.error(
    'Please specify "prod" or "sandbox" as an argument (e.g., "prod" or "sandbox").',
  )
  process.exit(1)
}

// Determine the source file based on the environment
const sourceFile = env === 'prod' ? 'blocks-prod.json' : 'blocks-sandbox.json'
const destinationFile = 'blocks.json'
const backupFile = 'blocks-backup.json'

// Backup the original blocks.json file
if (fs.existsSync(destinationFile)) {
  fs.copyFileSync(
    path.join(__dirname, destinationFile),
    path.join(__dirname, backupFile),
  )
}

// Copy and rename the appropriate blocks file
fs.copyFileSync(
  path.join(__dirname, sourceFile),
  path.join(__dirname, destinationFile),
)

// Use the local fusion command directly instead of going through npm
// This helps avoid path issues in WSL
const fusionCommand = './node_modules/.bin/fusion zip'
exec(fusionCommand, (error, stdout) => {
  if (error) {
    console.error(`Error executing 'fusion zip': ${error}`)
    restoreOriginalFile()
    return
  }
  console.log(`'fusion zip' output:\n${stdout}`)

  // Restore the original blocks.json file
  restoreOriginalFile()
})

function restoreOriginalFile() {
  if (fs.existsSync(path.join(__dirname, backupFile))) {
    fs.copyFileSync(
      path.join(__dirname, backupFile),
      path.join(__dirname, destinationFile),
    )
    fs.unlinkSync(path.join(__dirname, backupFile)) // Remove the backup file
  }
}
