import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applySiteSubmission, parseIssueSubmission } from "../scripts/apply-site-submission.mjs";

const issueBody = `### Site submission

Please review this site entry and add it to \`data/sites.json\` if approved.

Group: Projects

\`\`\`json
{
  "name": "discord tools",
  "description": "a web tools",
  "url": "https://discordlookup.org",
  "status": "Online",
  "tags": ["Tool", "Docs"]
}
\`\`\``;

test("parses a site submission issue body", () => {
  const submission = parseIssueSubmission(issueBody);

  assert.equal(submission.groupTitle, "Projects");
  assert.deepEqual(submission.site, {
    name: "discord tools",
    description: "a web tools",
    url: "https://discordlookup.org",
    status: "Online",
    tags: ["Tool", "Docs"],
  });
});

test("applies a site submission to the selected group", () => {
  const dir = mkdtempSync(join(tmpdir(), "site-submission-"));
  const dataPath = join(dir, "sites.json");
  writeFileSync(
    dataPath,
    JSON.stringify({ siteGroups: [{ title: "Projects", items: [] }] }, null, 2),
  );

  const result = applySiteSubmission(issueBody, dataPath);
  const data = JSON.parse(readFileSync(dataPath, "utf8"));

  assert.equal(result.site.name, "discord tools");
  assert.equal(data.siteGroups[0].items.length, 1);
  assert.equal(data.siteGroups[0].items[0].url, "https://discordlookup.org");
});