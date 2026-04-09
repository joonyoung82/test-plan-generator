<<<<<<< HEAD
# test-plan-generator
AI-powered tool that transforms project descriptions into structured test   plans with TestRail-compatible CSV export. Supports Gemini, ChatGPT, and   Claude
=======
# Test Plan Generator

An AI-powered tool that transforms project descriptions into structured, professional test plans with TestRail-compatible CSV export. Built with vanilla JavaScript and the Claude API.

## Features

- **Structured Test Plans** — Generates test suites with individual test cases including steps, expected results, priorities, and test types
- **Risk Assessment** — Identifies high-risk areas needing deeper coverage
- **TestRail CSV Export** — Download test cases in a format ready to import into TestRail, Zephyr, or Xray
- **Multiple Test Types** — Functional, Negative, Boundary, Integration, Regression, Accessibility, Performance, Security
- **Coverage Levels** — Comprehensive, critical paths only, or smoke test
- **Client-Side Only** — Your API key never leaves your browser
- **Dark Mode** — Respects system preference with manual toggle

## Usage

1. Visit [joonyoung82.github.io/test-plan-generator](https://joonyoung82.github.io/test-plan-generator)
2. Enter your [Claude API key](https://console.anthropic.com/)
3. Paste a project description, PRD, user story, or Confluence page content
4. Configure test options (platform, test types, coverage level)
5. Click **Generate Test Plan**
6. Export: **Download TestRail CSV** | **Copy Markdown** | **Copy Text**

## Test Plan Output

Each generated test plan includes:

- **Summary** — Objectives, scope, and strategy
- **Risk Assessment** — Impact and likelihood analysis
- **Test Suites & Cases** — Grouped by feature area with ID, title, type, priority, preconditions, steps, and expected result
- **Environment & Prerequisites** — Devices, browsers, test data
- **Entry & Exit Criteria** — When to start and stop testing

## Local Development

```bash
cd test-plan-generator
python3 -m http.server 8000
# Open http://localhost:8000
```

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- Claude API (claude-sonnet-4-6)
- GitHub Pages

## Author

[Joon Lee](https://joonyoung82.github.io/) — Senior QA Engineer
>>>>>>> 8ce5cae (Initial commit: AI Test Plan Generator)
