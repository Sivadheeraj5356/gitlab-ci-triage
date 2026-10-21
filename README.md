# GitLab CI Triage

A small client-side tool that turns a noisy GitLab CI job log into a concise triage handoff.

## What it does

- Detects common failure classes: tests, dependencies, Docker or runner, lint or type checks, and timeouts.
- Groups matched evidence so the next owner can see why the tool chose a class.
- Drafts a short handoff that can be pasted into an issue, Slack thread, or incident note.
- Runs entirely in the browser. Pasted logs are not sent anywhere.

## Run

Open `index.html` in a browser, or serve the folder with any static server.

```bash
python3 -m http.server 8080
```

## Test

```bash
node test.js
```

Built as a focused GitLab workflow improvement by Siva Dheeraj.
