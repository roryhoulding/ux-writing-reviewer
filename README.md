# UX Writing reviewer
An experiment in context engineering and RAG based AI applications.

### How it works
- When a PR is set to ready for review, a github action is triggered that runs the [review-pr service](https://github.com/roryhoulding/ux-writing-reviewer/blob/main/services/review-pr.tsx)
- UX writing guidelines are stored in a vector database ([Shopify Polaris](https://polaris-react.shopify.com/content) used as an example)
- Service uses Open AI responses API + file_search tool to generate UX writing suggestions on the user facing copy
- Suggested changes are posted as comments on the PR via Github API

### Example
[See this PR](https://github.com/roryhoulding/ux-writing-reviewer/pull/6/files)

<img width="682" height="542" alt="image" src="https://github.com/user-attachments/assets/c9fbfc5f-1cc9-49e1-9c3d-dc8c742dbe0b" />
