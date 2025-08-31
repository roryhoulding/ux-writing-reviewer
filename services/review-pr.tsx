const fs = require('fs');
const { Octokit } = require('octokit');
const path = process.env.GITHUB_EVENT_PATH;

async function main() {
  if (!path) {
    console.error('GITHUB_EVENT_PATH is not set.');
    return;
  }
  
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
  
  const eventData = JSON.parse(fs.readFileSync(path, 'utf8'));
  const { pull_request, repository } = eventData;
  const { number } = pull_request;

  const owner = repository?.owner?.login;
  const repo = repository?.name;
  
  if (!owner) {
    console.error('Could not determine owner');
    return;
  }

  if (!repo) {
    console.error('Could not determine repo name');
    return;
  }
  
  const reviews = await octokit.rest.pulls.listReviews({
    owner: owner,
    repo: repo,
    pull_number: number,
  });

  console.log('Reviews:', reviews.data);
  
  console.log('Event Data:', eventData);
} 

main().catch(console.error);