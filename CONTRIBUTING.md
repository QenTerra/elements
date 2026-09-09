# Contributing

Elements accepts focused bug fixes, accessibility improvements, tests, and
documentation corrections.

## Before opening an issue

- Search existing issues and releases.
- Confirm the problem with the latest release or current `main` branch.
- Record the browser name and version, operating system, page URL when it can
  be shared, and exact reproduction steps.
- Use GitHub's private vulnerability reporting for security issues. Do not put
  exploit details in a public issue.

## Local verification

Use Node.js 22, npm, and Python 3.11 or later:

```sh
node scripts/verify-repository.mjs
```

The verifier works in a unique temporary directory outside the checkout. It
installs dependencies, browsers, build output, reports, and release staging
there, then removes them after the gate. Set
`ELEMENTS_KEEP_VERIFY_WORKSPACE=1` only when you need to inspect that external
workspace.

## Commit and review format

Follow [Release writing](docs/release-writing.md) for commit grammar, PR and review
comment templates, changelog entries, release notes, and publication updates.
Write in English, use a specific Conventional Commit subject of at most 72
characters, and keep one coherent outcome per change. Breaking changes include
a migration footer. PR descriptions use the repository template's section order;
review findings explain the condition, consequence, and requested change.

## Pull requests

- Keep one change per pull request.
- Add or update tests for behavior changes.
- Run `node scripts/verify-repository.mjs` before submitting.
- Include before and after screenshots for visible UI changes.
- Update user-facing documentation when behavior, permissions, storage, or
  installation steps change.
- Keep caches, dependency installs, build output, reports, temporary files,
  personal paths, AI or agent operating files, prompts, transcripts, skills,
  and tool state outside the repository. Ignoring a path does not make it
  acceptable in a public checkout.

Commit subjects use the Conventional Commits form, for example:

```text
fix(picker): keep the locked target while opening actions
docs(readme): clarify Chrome installation
```

Use the imperative mood, keep the subject specific, and omit generated
signatures or tool attribution.

## Formatting

Run Prettier only for files in your change, then review the resulting diff. The
complete verifier checks TypeScript, Oxlint, Prettier, documentation, Vitest,
builds, browser flows, release artifacts, and repository governance.

## License

By contributing, you agree that your contribution is available under the
project's [MIT License](LICENSE).
