import { readFileSync, existsSync } from "node:fs";
import { parse } from "node:path";

const read = (path) => readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const jsonFile = "data/sites.json";
const workflowFile = ".github/workflows/pages.yml";
const submissionWorkflowFile = ".github/workflows/site-submission.yml";
const submissionScriptFile = "scripts/apply-site-submission.mjs";
const requiredFiles = [
  "index.html",
  "assets/app.js",
  "assets/styles.css",
  "assets/favicon.svg",
  "README.md",
  jsonFile,
  workflowFile,
  submissionWorkflowFile,
  submissionScriptFile,
];

for (const file of requiredFiles) {
  assert(existsSync(file), `Missing required file: ${file}`);
  assert(parse(file).base.length > 0, `Invalid file path: ${file}`);
}

const index = read("index.html");
const app = read("assets/app.js");
const workflow = read(workflowFile);
const submissionWorkflow = read(submissionWorkflowFile);
const submissionScript = read(submissionScriptFile);
const data = JSON.parse(read(jsonFile));

assert(index.includes("data/sites.json"), "index.html should preload data/sites.json");
assert(!index.includes("assets/site-data.js"), "index.html should not load assets/site-data.js");
assert(app.includes("data/sites.json"), "app.js should fetch data/sites.json");
assert(!app.includes("localStorage"), "production Add Site flow should not use localStorage");
assert(app.includes("github.com") && app.includes("issues/new"), "Add Site should create a GitHub issue");

assert(data.profile?.name === "Brice94", "sites.json should include profile.name");
assert(Array.isArray(data.siteGroups) && data.siteGroups.length >= 1, "sites.json should include siteGroups");
assert(
  data.siteGroups.every((group) => Array.isArray(group.items)),
  "each site group should include an items array",
);

for (const group of data.siteGroups) {
  for (const site of group.items) {
    assert(site.name && site.url && site.description, `Site entry in ${group.title} is incomplete`);
    new URL(site.url);
  }
}

assert(workflow.includes("actions/deploy-pages"), "workflow should deploy with GitHub Pages action");
assert(workflow.includes("actions/configure-pages"), "workflow should configure GitHub Pages");
assert(workflow.includes("node scripts/validate-site.mjs"), "workflow should run the site validator");
assert(submissionWorkflow.includes("issues:"), "site submission workflow should run from issues");
assert(submissionWorkflow.includes("gh pr create"), "site submission workflow should create a pull request");
assert(submissionWorkflow.includes("contents: write"), "site submission workflow should be able to push a branch");
assert(submissionScript.includes("parseIssueSubmission"), "site submission script should parse issue submissions");

console.log("site validation passed");
