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
  
  try {
    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pull_request.number,
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
    });

<<<<<<< HEAD
<<<<<<< Updated upstream
    console.log('Reviews:', reviews.data);
=======
    const diff = response.data;
    
>>>>>>> Stashed changes
=======
    console.log(response.data);
    
>>>>>>> 28b27fe0c94dd72199ea03645e35c69a9b6ea078
  } catch (error: any) {
    console.error('Error accessing pull request:', error);
  }
} 

main().catch(console.error);