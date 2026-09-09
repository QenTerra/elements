import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { writeReleaseNotes } from './release-notes.mjs'

const repositoryUrl = 'https://github.com/QenTerra/elements'
const archiveBytes = Buffer.from('synthetic release archive')
const firstRelease = (separator = '-', date = '2026-07-29') => `# Changelog

## [Unreleased]

### Added

- Do not include unreleased changes.

## [1.0.0] ${separator} ${date}

### Fixed

- Preserve saved rules.

### Added

- Inspect elements.

### Privacy and security

- Keep saved rules local.

[1.0.0]: ${repositoryUrl}/releases/tag/v1.0.0
[Unreleased]: ${repositoryUrl}/compare/v1.0.0...HEAD
`

async function fixture(t, changelog = firstRelease(), version = '1.0.0', archive = true) {
  const root = await mkdtemp(join(tmpdir(), 'elements-release-notes-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, '.output'))
  await writeFile(join(root, 'package.json'), JSON.stringify({ version, type: 'module' }))
  await writeFile(join(root, 'CHANGELOG.md'), changelog)
  if (archive)
    await writeFile(join(root, '.output', `elements-${version}-chrome.zip`), archiveBytes)
  const output = join(root, 'notes', 'release.md')
  return { root, output }
}

for (const separator of ['-', '—']) {
  test(`generates canonical notes from ${separator} headings with non-visible reference metadata`, async (t) => {
    const { root, output } = await fixture(t, firstRelease(separator))
    await writeReleaseNotes(root, 'v1.0.0', output)
    const notes = await readFile(output, 'utf8')
    assert.match(
      notes,
      /^Elements 1\.0\.0 is distributed as an unsigned Chrome extension archive\.\n/,
    )
    assert.deepEqual(notes.match(/^## .+$/gm), [
      '## Added',
      '## Fixed',
      '## Security',
      '## Downloads',
      '## Full changelog',
    ])
    assert.match(notes, /The archive is unsigned\./)
    assert.ok(
      notes.includes(
        `${createHash('sha256').update(archiveBytes).digest('hex')}  elements-1.0.0-chrome.zip`,
      ),
    )
    assert.ok(notes.includes(`${repositoryUrl}/releases/download/v1.0.0/elements-1.0.0-chrome.zip`))
    assert.ok(notes.includes(`[v1.0.0](${repositoryUrl}/releases/tag/v1.0.0)\n`))
    assert.doesNotMatch(notes, /Do not include|^### |## SHA-256/gm)
  })
}

test('preserves upgrade prose, canonical category order and previous-release comparison', async (t) => {
  const changelog = `## [1.1.0] - 2026-08-01

Restart the browser after upgrading.

### Security

- Sanitize stored rules.

### Removed

- Remove the old import format.

### Deprecated

- Use the new import format.

### Changed

- Update the options page; see [details][guide].

${firstRelease().replace('## [Unreleased]', '## [older-unreleased-placeholder]')}
[1.1.0]: ${repositoryUrl}/compare/v1.0.0...v1.1.0
[guide]: ${repositoryUrl}/blob/main/README.md
`
  // Keep the fixture's only preceding release boundary at 1.0.0.
  const cleanChangelog = changelog.replace(/# Changelog[\s\S]*?(?=## \[1\.0\.0\])/, '')
  const { root, output } = await fixture(t, cleanChangelog, '1.1.0')
  await writeReleaseNotes(root, 'v1.1.0', output)
  const notes = await readFile(output, 'utf8')
  assert.deepEqual(notes.match(/^## .+$/gm), [
    '## Upgrade notes',
    '## Changed',
    '## Deprecated',
    '## Removed',
    '## Security',
    '## Downloads',
    '## Full changelog',
  ])
  assert.match(notes, /Restart the browser after upgrading\./)
  assert.ok(notes.includes('[details][guide]'))
  assert.ok(notes.includes(`[guide]: ${repositoryUrl}/blob/main/README.md`))
  assert.ok(notes.includes(`[v1.0.0...v1.1.0](${repositoryUrl}/compare/v1.0.0...v1.1.0)`))
  assert.doesNotMatch(notes, /Preserve saved rules/)
})

for (const date of ['2026-02-30', '2026-13-01', '2026-07', 'draft']) {
  test(`rejects invalid release date ${date}`, async (t) => {
    const { root, output } = await fixture(t, firstRelease('-', date))
    await assert.rejects(writeReleaseNotes(root, 'v1.0.0', output), /valid release date/)
    await assert.rejects(readFile(output), { code: 'ENOENT' })
  })
}

test('rejects missing version, wrong tag, missing archive and invalid comparison', async (t) => {
  for (const [changelog, tag, archive, error] of [
    ['## [Unreleased]\n', 'v1.0.0', true, /has no 1.0.0 section/],
    [firstRelease(), 'v1.1.0', true, /does not match/],
    [firstRelease(), 'v1.0.0', false, /ENOENT/],
    [
      firstRelease().replace('/releases/tag/v1.0.0', '/compare/v0.9.0...v1.0.0'),
      'v1.0.0',
      true,
      /link for 1.0.0 must match/,
    ],
  ]) {
    const { root, output } = await fixture(t, changelog, '1.0.0', archive)
    await assert.rejects(writeReleaseNotes(root, tag, output), error)
    await assert.rejects(readFile(output), { code: 'ENOENT' })
  }
})

for (const separator of ['-', '—']) {
  test(`release verifier accepts ${separator} heading`, async (t) => {
    const { root } = await fixture(t, firstRelease(separator))
    await mkdir(join(root, 'scripts'))
    await copyFile(
      new URL('./verify-release.mjs', import.meta.url),
      join(root, 'scripts', 'verify-release.mjs'),
    )
    await writeFile(join(root, 'README.md'), 'elements-1.0.0-chrome.zip')
    const { stdout } = await promisify(execFile)(process.execPath, [
      join(root, 'scripts', 'verify-release.mjs'),
      'v1.0.0',
    ])
    assert.match(
      stdout,
      /Release v1.0.0 matches package version 1.0.0 and changelog date 2026-07-29/,
    )
  })
}

for (const title of [
  '',
  ' "Migration guide"',
  " 'Migration guide'",
  ' (Migration guide)',
  '\n  "Migration guide"',
]) {
  test(`preserves collapsed, shortcut and case-insensitive references with title ${JSON.stringify(title)}`, async (t) => {
    const changelog =
      firstRelease().replace(
        '- Inspect elements.',
        '- Read [migration][] before upgrading; also see [migration] and [steps][MIGRATION].\n- Keep [migration](https://example.invalid/inline) unchanged.',
      ) + `\n[migration]: https://example.invalid/migration${title}\n`
    const { root, output } = await fixture(t, changelog)
    await writeReleaseNotes(root, 'v1.0.0', output)
    const notes = await readFile(output, 'utf8')
    assert.ok(
      notes.includes(
        '- Read [migration][] before upgrading; also see [migration] and [steps][MIGRATION].',
      ),
    )
    assert.ok(notes.includes(`[migration]: https://example.invalid/migration${title}`))
    assert.ok(notes.includes('- Keep [migration](https://example.invalid/inline) unchanged.'))
  })
}

test('normalizes reference whitespace and preserves an angle-bracket destination and first definition', async (t) => {
  const changelog =
    firstRelease().replace('- Inspect elements.', '- See [steps][Migration   guide].') +
    '\n[Migration guide]: <https://example.invalid/migration> "Upgrade"\n[migration GUIDE]: https://example.invalid/wrong\n'
  const { root, output } = await fixture(t, changelog)
  await writeReleaseNotes(root, 'v1.0.0', output)
  const notes = await readFile(output, 'utf8')
  assert.ok(notes.includes('- See [steps][Migration   guide].'))
  assert.ok(notes.includes('[Migration guide]: <https://example.invalid/migration> "Upgrade"'))
  assert.ok(notes.indexOf('[Migration guide]:') < notes.indexOf('[migration GUIDE]:'))
})

for (const fence of ['```', '~~~~']) {
  test(`preserves inline code spans and ${fence} fenced code verbatim`, async (t) => {
    const sample = [
      '- The configuration key is `[migration]`; read [migration].',
      '- Literal backticks: `` `[migration]` ``.',
      '- A multiline span: `first line',
      '[migration]: https://example.invalid/code-span',
      'last line`.',
      '',
      `${fence}markdown`,
      '[migration]: https://example.invalid/fenced',
      '## [9.9.9] - 2026-01-01',
      '### Fenced heading',
      '[migration][] and [steps][MIGRATION]',
      fence,
    ].join('\n')
    const changelog =
      firstRelease().replace('- Inspect elements.', sample) +
      '\n[migration]: https://example.invalid/migration "Guide"\n'
    const { root, output } = await fixture(t, changelog)
    await writeReleaseNotes(root, 'v1.0.0', output)
    const notes = await readFile(output, 'utf8')
    assert.ok(notes.includes(sample))
    assert.ok(notes.includes('[migration]: https://example.invalid/migration "Guide"'))
    assert.doesNotMatch(notes, /`\[migration\]\(https:/)
    assert.equal(notes.split('https://example.invalid/fenced').length - 1, 1)
  })
}

for (const placement of ['before-release', 'earlier-category']) {
  test(`preserves first reference definition from ${placement}`, async (t) => {
    const canonical = '[guide]: https://example.invalid/canonical "Original"'
    let changelog = firstRelease().replace(
      '- Inspect elements.',
      '- Read [guide].\n\n[guide]: https://example.invalid/shadow',
    )
    changelog =
      placement === 'before-release'
        ? `${canonical}\n\n${changelog}`
        : changelog.replace('- Preserve saved rules.', `- Preserve saved rules.\n\n${canonical}`)
    const { root, output } = await fixture(t, changelog)
    await writeReleaseNotes(root, 'v1.0.0', output)
    const notes = await readFile(output, 'utf8')
    assert.equal(notes.match(/^\[guide\]: .+$/m)?.[0], canonical)
    assert.ok(notes.includes('- Read [guide].'))
  })
}

test('does not promote a multiline code span into reference metadata', async (t) => {
  const literal = '- Literal: `first\n[guide]: https://example.invalid/literal\nlast`.'
  const changelog =
    firstRelease().replace('- Inspect elements.', `${literal}\n\n- Read [guide].`) +
    '\n[guide]: https://example.invalid/canonical\n'
  const { root, output } = await fixture(t, changelog)
  await writeReleaseNotes(root, 'v1.0.0', output)
  const notes = await readFile(output, 'utf8')
  assert.ok(notes.includes(literal))
  assert.equal(notes.match(/^\[guide\]: .+$/m)?.[0], '[guide]: https://example.invalid/canonical')
})
