const fs = require('fs');
const path = process.env.GITHUB_EVENT_PATH;

if (path) {
  const eventData = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log('Event Data:', eventData);
} else {
  console.error('GITHUB_EVENT_PATH is not set.');
}