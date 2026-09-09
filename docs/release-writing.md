# Release writing

Use these conventions for commits, pull requests, review comments, changelogs,
release notes, and publication updates. The project's [release procedure](RELEASING.md)
defines its actual verification and distribution requirements.

## Language and style

- Write repository messages in English unless the project explicitly selects
  another language. Localised notes retain the same facts and section order.
- Use sentence case, plain Markdown, `-` bullets, and blank lines around blocks.
  End complete prose sentences with periods; commit subjects have no trailing period.
- Name the affected feature, triggering condition, and observable result. Explain
  implementation details only when they help review or migration.
- Avoid emoji headings, generic praise, raw commit dumps, task narration, and
  unsupported claims such as “various improvements.”
- Keep one coherent change per bullet. Remove optional empty sections and all
  instructional placeholders. Retain required checks or explain inapplicability.
- Preserve released history and published artifacts. Formatting cleanup does not
  authorise rewriting shared commits, moving tags, or replacing release assets.

## Commit grammar

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
`type(scope): imperative description`. The scope is optional, lowercase kebab-case,
and names a stable component. Keep the complete subject within 72 characters,
start the description lowercase unless an identifier requires case, and omit a
trailing period. Explain why and consequences in an optional body.

Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `security`, `release`, and `revert`. Use `perf` for measured improvement
and `release` for version/release metadata only. Incompatible changes use `!`
or `BREAKING CHANGE:` and always include actionable migration guidance in the
footer. Include issue and authorship trailers only when truthful and applicable.

PR titles use the same grammar. Keep one reviewable outcome per commit and PR;
remove WIP, checkpoint, fixup, and squash subjects before durable integration.
Review comments state the location, condition, consequence, and requested change.
Use a priority only for a substantiated finding, `Suggestion:` for nonblocking
feedback, and `Question:` for an unresolved question.

## Changelog and release structure

Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Keep `Unreleased`
first and released versions newest first, using `## [version] - YYYY-MM-DD`.
Use the actual publication date. The version has no tag prefix.

Keep nonempty categories in this order: `Added`, `Changed`, `Deprecated`,
`Removed`, `Fixed`, `Security`. Describe user, consumer, or operator impact,
not individual commits. Deprecations identify the replacement and removal window;
if no removal is scheduled, say so. Mark incompatible entries `**Breaking:**`
and put required migration guidance before the categories. Publish security
detail only through the project's authorised disclosure process.

Use `<Product> <version>` as the GitHub Release title, retaining the full version
and prerelease suffix. A native application's display/build label remains governed
by its product manifest; do not substitute it for the GitHub Release title.
Start the body with one factual sentence. Then use applicable sections in this
order: `Upgrade notes`, the changelog categories, `Downloads`, `Known issues`,
`Verification`, `Acknowledgements`, `Full changelog`. Changelog entries retain
their meaning in release notes. Omit optional empty sections.

Downloads identify the actual asset, platform, architecture, checksum, and verified
signing status. Source-only releases say so and do not present source archives as
installers. Prereleases state their channel and limits and require the provider's
prerelease flag. Always include a real comparison link, or the first release's tag
link when there is no predecessor. `Unreleased` links the latest tag to `main`;
before any release, link to the branch history instead of inventing a tag.

GitHub's generated notes are a draft: reconcile them with the changelog, remove
internal noise, and check category placement and attribution. Use `release: skip-notes`
only for changes with no reader impact; do not hide relevant security or dependency
changes because a bot authored them. The catch-all generated category is for review
and must be resolved into the canonical categories before publication.

## Publishing and reporting

Prepare the final body, target commit, version, tag, and assets before requesting
missing publication approval. Local commits, pushes, tags, hosted drafts, published
releases, package uploads, deployments, update feeds, and external comments are
separate actions. Reuse existing approval only within its stated scope.

Preview the final Markdown and check links. Pass multiline text as a structured
argument or UTF-8 body file, not shell-interpolated prose. After writing, read back
each affected provider surface: target commit, peeled tag, title, body, draft and
prerelease flags, assets, checksums, and any registry or deployment version.

Report verified publication, draft state, and incomplete surfaces separately.
After an uncertain request, inspect whether it succeeded before retrying. Never
silently replace an immutable artifact or move a published tag to repair a mistake.

## Templates

Replace every angle-bracket field. All sample product changes below are fictional
formatting examples, not release history. Keep the project's actual PR checklist.

## Commit

```text
<type>(<scope>): <imperative change>

<Why the change is needed and its relevant consequences. Omit for an obvious change.>

Refs: <actual issue or pull request>
```

Omit the scope and trailer when not applicable. These are fictional formatting examples, not product history:

```text
fix(player): preserve the queue when playback resumes

Resume from the saved queue instead of rebuilding it from the library.
This retains tracks added during the previous playback session.
```

```text
feat(config)!: require an explicit library path

BREAKING CHANGE: set libraryPath before starting the player; automatic
discovery of the current directory has been removed.
```

```text
release: prepare 1.4.0
```

Use the release type only when the actual diff contains version and release metadata. A revert explains why and identifies the real reverted SHA in its body or `Refs:` trailer.

## Pull Request

Title: `<type>(<scope>): <observable change>`.

```markdown
## Purpose

<Problem, trigger, and resulting behaviour in one short paragraph.>

## Scope

- <Concrete affected component and change.>

## Verification

- `<command>` — <observed result on the reviewed revision>.
- Unverified: <material check still missing and why, if any>.

## Evidence

<Relevant revision, fixture, environment, and safe evidence link.>

## Risk and recovery

<Failure modes, migration and security/privacy impact, and concrete rollback.>

## Documentation and release

<Documentation and changelog changes, compatibility/version impact, and dependency/license impact.>

## Checklist

- [ ] The title and diff describe one coherent change.
- [ ] Verification and documentation match the reviewed revision.
- [ ] Material manual and external gaps are explicit.
- [ ] Content is safe to share with this repository's audience.
```

Use the adopted repository checklist when it has additional required fields. Check boxes only after performing the check; delete instructional placeholders, not required checks.

## Review Comment and Resolution

```text
[P1] Preserve the queue when playback resumes

When a saved session contains manually queued tracks, rebuilding it from
the library drops those tracks. Restore the saved queue before starting
playback and verify a resume with tracks absent from the library order.
```

```text
Suggestion: name the unit in the timeout parameter

Rename timeout to timeoutMs so callers can see the expected unit.
```

```text
Resolved in <revision>: <specific repair>. Verified with <check and result>.
<Any remaining limitation or unresolved finding.>
```

Attach findings to the smallest relevant code location. These examples do not authorise posting comments.

## Changelog Entry

```markdown
## [Unreleased]

## [<version>] - <YYYY-MM-DD>

<Required upgrade action and migration link, only when applicable.>

### Added

- <New capability and what the user can do with it.>

### Changed

- **Breaking:** <Changed contract and required migration.>

### Deprecated

- <Deprecated feature, replacement, and removal window.>

### Removed

- <Removed feature and migration path.>

### Fixed

- <Corrected failure and the condition that triggered it.>

### Security

- <Authorised disclosure summary and public advisory link, if available.>

[Unreleased]: <repository-url>/compare/<current-tag>...<default-branch>
[<version>]: <repository-url>/compare/<previous-tag>...<current-tag>
```

Keep only nonempty categories. For the first release, replace the last comparison with the tag or release URL. Example of useful wording: “Fixed a crash when importing an empty playlist.” Avoid “fix(import): handle edge cases.”

## Release Body

Title: `<Product> <version>`; set tag and provider prerelease status separately.

```markdown
<One factual sentence describing this release and its distribution boundary.>

## Upgrade notes

<Required action, compatibility changes, and migration link.>

## Added

- <Entry from the released changelog.>

## Fixed

- <Entry from the released changelog.>

## Downloads

| Artifact                                          | Platform              | Integrity                                              |
| ------------------------------------------------- | --------------------- | ------------------------------------------------------ |
| [<exact filename>](https://example.invalid/asset) | <OS and architecture> | [SHA-256 checksums](https://example.invalid/checksums) |

<Verified signing or notarisation status when relevant.>

## Known issues

- <Condition, limitation, workaround, and issue link.>

## Verification

<Tested environment and material remaining gaps.>

## Acknowledgements

<Actual contribution and authorised attribution.>

## Full changelog

[<previous-tag>...<current-tag>](https://example.invalid/compare)
```

The body shows two example categories; insert other nonempty categories in the order specified above. Omit optional sections, use the first-release link when needed, and substitute package installation details for a package release. Source-only releases omit `Downloads`. Do not claim an installer, signing result, or workaround from the example alone.

## Publication Receipt

Use this for a maintainer status update after publication, not as an automatic appendix to release notes.

```markdown
<Published | Draft | Partially published | Unverified | Blocked>: <product and version>.

- Target: `<full commit SHA>`; tag: `<tag>`.
- <Surface>: <verified state and authoritative link>.
- Verification: <actual checks and observed provider readback>.
- Remaining: <only incomplete effects, checks, or required action>.
```

Report each intended surface separately when outcomes differ. Example: a verified GitHub Release with an unverified registry publication is `Partially published`; it is not “release complete.”
