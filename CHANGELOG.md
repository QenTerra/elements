# Changelog

All notable changes to Elements are documented in this file.

## [Unreleased]

### Changed

- Standardised commit messages, pull request reviews, changelogs, and release notes with shared contributor templates.

- Adopted QenTerra repository standard 1.3.0 with the canonical Contact block and funding-surface prohibition.
- Adopted the QenTerra public repository standard, including complete
  contribution, maintenance, release, Wiki, and contact documentation.
- Moved dependency installs, generated builds, browser downloads, reports, and
  release verification into external temporary workspaces.
- Required pull requests, successful project and governance checks, resolved
  review conversations, linear history, and immutable release tags at GitHub.

### Removed

- Removed external donation configuration, badges, and README prose.

### Security

- Updated the transitive `brace-expansion`, `nanoid`, and `postcss` resolutions
  to versions that clear the current high-severity npm audit gate.

## [1.0.0] — 2026-07-29

### Added

- Chrome and Chromium Manifest V3 production build.
- Click-to-lock element picker with layer navigation, accessible controls, and
  adaptive desktop and narrow-screen layouts.
- Actions for hiding elements, editing visible text, rounding corners, blurring,
  dimming, grayscale, and sanitized custom CSS.
- Undo and redo for edits, deletions, selector changes, and imported backups.
- Per-site rules with browser-managed storage, local fallback, pause controls,
  search, sorting, import, export, and transactional rollback.
- Light, dark, and system themes, onboarding, keyboard shortcuts, responsive
  Options pages, and English and Russian localization.
- Automated validation, unit and browser tests, production build, release
  archive, and a GitHub Pages product site.

### Changed

- Hover preview and locked selection are separate states, so entering the picker
  controls cannot silently retarget an action.
- Persistent writes pass through a typed, runtime-validated background protocol.
- Text editing preserves original DOM nodes and event listeners.
- Rules are reapplied safely after reload without resetting unrelated undo
  history.

### Fixed

- Clicking outside the picker clears the current selection instead of
  immediately selecting another element.
- Breadcrumb focus follows keyboard layer navigation.
- Picker menus, editors, history actions, and selector controls remain usable at
  narrow widths, high zoom, and viewport edges.
- Concurrent storage operations cannot lose metadata or resurrect deleted rules.
- Extension-owned overlays and styles are removed deterministically.

### Privacy and security

- No analytics, ads, remote code, or developer-operated backend.
- Saved rules stay in browser-managed extension storage.
- Incognito edits remain temporary.
- Custom CSS is sanitized before it is stored or applied.

[1.0.0]: https://github.com/QenTerra/elements/releases/tag/v1.0.0
[Unreleased]: https://github.com/QenTerra/elements/compare/v1.0.0...HEAD
