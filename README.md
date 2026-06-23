# wangbing-coder.github.io

Static personal homepage for `wangbing-coder.github.io`.

The site uses a white and blue visual system, plain HTML/CSS/JavaScript, and no build step.
Content is stored in `data/sites.json` and deployed with GitHub Actions to GitHub Pages.

## Local Preview

Run a local static server. This is required because the page fetches `data/sites.json`.

```powershell
cd C:\path\to\wangbing-coder.github.io
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Validate Locally

```powershell
node scripts/validate-site.mjs
```

If Node is not on PATH, use the bundled runtime provided by your local environment.

## Edit Permanent Content

Most content lives in `data/sites.json`.

To add a permanent site, add an item inside one of the `siteGroups`:

```js
{
  name: "My Site",
  description: "Short description for visitors.",
  url: "https://example.com",
  status: "Online",
  tags: ["Docs", "Tool"]
}
```

## Add Sites From The Page

The page includes an `Add Site` form. Because GitHub Pages is static, the form does not write directly to the repository.

Form behavior:

- Opens a GitHub issue against `brice94/wangbing-coder.github.io`.
- Includes a JSON snippet for the requested site entry.
- Lets you review the submission before adding it to `data/sites.json`.

This avoids exposing a write token in the browser.

## Publish To GitHub Pages

1. Create a GitHub repository named `wangbing-coder.github.io`.
2. Put these files in the repository root.
3. Commit and push to `master`.
4. Open repository `Settings` -> `Pages`.
5. Set Source to `GitHub Actions`.
6. Push to `master`.
7. Wait for the `Validate and deploy site` workflow to finish.
8. Open `https://wangbing-coder.github.io/`.

## Recommended Maintenance Flow

1. A visitor submits a site through the Add Site form.
2. GitHub Actions creates a pull request from the issue.
3. Review the generated PR.
4. Merge the PR if the site entry is approved.
5. GitHub Actions validates and deploys the updated site.
