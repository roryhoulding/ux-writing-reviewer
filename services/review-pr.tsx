import fs from 'fs';
import { Octokit } from 'octokit';
import { z } from 'zod';
import 'dotenv/config';
import { OpenAI } from 'openai';


const path = process.env.GITHUB_EVENT_PATH;
const token = process.env.GITHUB_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;


const DiffResponseSchema = z.string();

// export const GenerateCommentsResponseSchema = z.array(z.object({
//   text: z.string(),
//   start_line: z.number(),
//   end_line: z.number(),
//   start_column: z.number(),
//   end_column: z.number(),
//   path: z.string(),
//   type: z.string(),
//   severity: z.string(),
// }));

type Diff = z.infer<typeof DiffResponseSchema>;

interface Comment {
  path: string;
  line: number;
  body: string;
}

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

  let diff: Diff = '';

  try {
    diff = await getDiff(octokit, owner, repo, pull_request.number);
  } catch (error: any) {
    throw new Error('Error getting diff', error);
  }

  const comments: Comment[] = [
      {
        path: "README.md",  
        line: 2,              
        body: "Consider renaming this variable for clarity",
      }
  ]

  await postComments(octokit, owner, repo, pull_request.number, comments);
  
  console.log(diff);
}

async function getDiff(octokit: Octokit, owner: string, repo: string, pull_number: number): Promise<Diff> {
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

// async function generateComments(diff: Diff) {
//   const openai = new OpenAI({
//     apiKey: openaiApiKey,
//   });
// }

async function postComments(octokit: Octokit, owner: string, repo: string, pull_number: number, comments: Comment[]) {
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number,
    event: "COMMENT", 
    body: "Automated review with multiple comments 🚀",
    comments,
  });
}


main().catch(console.error);