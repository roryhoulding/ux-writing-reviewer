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

    const diff = response.data;
    console.log(diff);
  } catch (error: any) {
    console.error('Error accessing pull request:', error);
  }
} 

main().catch(console.error);