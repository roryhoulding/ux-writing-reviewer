import fs from 'fs';
import { Octokit } from 'octokit';

const path = process.env.GITHUB_EVENT_PATH;
const token = process.env.GITHUB_TOKEN;

async function main() {
  if (!path) {
    console.error('GITHUB_EVENT_PATH is not set.');
    return;
  }
  
  if (!token) {
    console.error('GITHUB_TOKEN is not set.');
    return;
  }
  
  const octokit = new Octokit({
    auth: token,
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
  
  console.log(`Attempting to access reviews for PR #${number} in ${owner}/${repo}`);
  
  try {
    // First, try to access the pull request itself to verify permissions
    const { data: pr } = await octokit.rest.pulls.get({
      owner: owner,
      repo: repo,
      pull_number: number,
    });
    console.log(`Successfully accessed PR: ${pr.title}`);
    
    // Now try to get reviews
    const reviews = await octokit.rest.pulls.listReviews({
      owner: owner,
      repo: repo,
      pull_number: number,
    });

<<<<<<< Updated upstream
    console.log('Reviews:', reviews.data);
=======
    const diff = response.data;
    
>>>>>>> Stashed changes
  } catch (error: any) {
    console.error('Error accessing pull request or reviews:', error);
    
    if (error.status === 403) {
      console.error('\n=== PERMISSIONS ISSUE DETECTED ===');
      console.error('The GitHub token does not have sufficient permissions.');
      console.error('Required permissions:');
      console.error('- For GitHub App: pull_requests: read');
      console.error('- For Personal Access Token: repo (private repos) or public_repo (public repos)');
      console.error('\nPlease check:');
      console.error('1. GitHub App permissions in the app settings');
      console.error('2. Repository access for the token');
      console.error('3. Token scopes and permissions');
    }
    
    if (error.status === 404) {
      console.error('\n=== REPOSITORY NOT FOUND ===');
      console.error('The repository or pull request could not be found.');
      console.error('Check if the token has access to this repository.');
    }
  }
  
  console.log('Event Data:', eventData);
} 

main().catch(console.error);