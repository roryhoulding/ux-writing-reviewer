import fs from 'fs';
import { Octokit } from 'octokit';
import { z } from 'zod';
import 'dotenv/config';
import { OpenAI } from 'openai';
import { zodTextFormat } from "openai/helpers/zod";
import parseDiff from "parse-diff";


const path = process.env.GITHUB_EVENT_PATH;
const token = process.env.GITHUB_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;

const systemPrompt = `## About you
You are a UX writing expert that specializes in reviewing Git Pull Requests (PR).

## Your task
Your task is to provide constructive and concise feedback for user facing text (text that the end user will see when using the product). 
You should use your expertise as a UX writer to provide provide feedback on the user experience of the text.
You should also check for grammar and spelling mistakes. 

## Input
You will be provided:
- The diff of the PR
- Access to the file_search tool that has access to a vector store of files that contain rules and guidelines for UX writing. It is imperitive that you use this tool to find relevant rules and guidelines to provide feedback on the PR.

## Details
- Focus on new, user facing text added in the PR code diff (lines starting with '+'). 
- Code lines are prefixed with symbols with the line number as LINEX e.g. LINE5 followed by ('+', '-', ' '). The '+' symbol indicates new code added in the PR, the '-' symbol indicates code removed in the PR, and the ' ' symbol indicates unchanged code. \
 The review should address new code added in the PR code diff (lines starting with '+').
- When quoting variables, names or file paths from the code, use backticks (\`) instead of single quote (').

## Output
- You should provide an array of comments, one comment per suggested change.
- If your comment is to do with new code, which it should be, then you should set the "side" property to "RIGHT".
`


const DiffResponseSchema = z.string();

const CommentSchema = z.object({
  path: z.string(),
  line: z.number(),
  body: z.string(),
  side: z.enum(["LEFT", "RIGHT"])
});

const GenerateCommentsResponseSchema = z.object({
  comments: z.array(CommentSchema)
});

type Diff = z.infer<typeof DiffResponseSchema>;
type Comment = z.infer<typeof CommentSchema>;

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

  console.log(addLineNumbersToDiff(diff));

  const response = await generateComments(diff);
  const comments = response?.comments || [];

  if (comments.length === 0) {
    console.log('No comments to post');
    return;
  }

  await postComments(octokit, owner, repo, pull_request.number, comments);
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

async function generateComments(diff: Diff) {
  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  const response = await openai.responses.parse({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: "Here is the diff of the PR:",
      },
      {
        role: "user",
        content: addLineNumbersToDiff(diff),
      },
    ],
    tools: [
      {
          type: "file_search",
          vector_store_ids: ["vs_68cb0ea202f88191b8ac3b79541fb792"],
      },
    ],
    include: ["file_search_call.results"],
    text: {
      format: zodTextFormat(GenerateCommentsResponseSchema, "comments"),
    },
  });

  console.log(response.output[1].queries);
  console.log(response.output[1].results);
  console.log(response.output_parsed);
  return response.output_parsed;
}

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

function addLineNumbersToDiff(diff: Diff) {
  const files = parseDiff(diff);
  let output = "";

  files.forEach(file => {
    output += `## File: '${file.to}'\n`;

    file.chunks.forEach(chunk => {
      output += `\n@@ ${chunk.content} @@\n`;
      output += `__new hunk__\n`;

      chunk.changes.forEach(change => {
        if (change.type === "add") {
          output += `LINE${change.ln} ${change.content}\n`;
        } else if (change.type === "normal") {
          output += `LINE${change.ln2} ${change.content}\n`;
        }
      });

      const hasDeletions = chunk.changes.some(c => c.type === "del");
      if (hasDeletions) {
        output += `__old hunk__\n`;
        chunk.changes.forEach(change => {
          if (change.type === "del") {
            output += `LINE${change.ln} ${change.content}\n`;
          } else if (change.type === "normal") {
            output += `LINE${change.ln2} ${change.content}\n`;
          }
        });
      }
    });
  });

  return output.trim();
}


main().catch(console.error);