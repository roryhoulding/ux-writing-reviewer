import fs from 'fs';
import { Octokit } from 'octokit';
import { z } from 'zod';
import 'dotenv/config';

const DiffResponseSchema = z.string();

const path = process.env.GITHUB_EVENT_PATH;
const token = process.env.GITHUB_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;

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

  let diff: z.infer<typeof DiffResponseSchema> = '';

  try {
    diff = await getDiff(octokit, owner, repo, pull_request.number);
  } catch (error: any) {
    throw new Error('Error getting diff', error);
  }
  
  console.log(diff);
}

async function getDiff(octokit: Octokit, owner: string, repo: string, pull_number: number): Promise<z.infer<typeof DiffResponseSchema>> {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      owner,
      repo,
      pull_number,
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
    });

    return DiffResponseSchema.parse(response.data);
  } catch (error: any) {
    throw new Error('Error getting diff', error);
  }
}

main().catch(console.error);