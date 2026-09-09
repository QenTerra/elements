#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryUrl = 'https://github.com/QenTerra/elements'
const categories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

export async function writeReleaseNotes(projectRoot, tag, outputPath) {
  const packageJson = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'))
  const changelog = await readFile(join(projectRoot, 'CHANGELOG.md'), 'utf8')
  const version = packageJson.version
  const expectedTag = `v${version}`

  if (tag !== expectedTag) {
    throw new Error(`Release tag ${tag || '(missing)'} does not match ${expectedTag}`)
  }
  if (!outputPath) throw new Error('Release notes output path is required')

  const lines = changelog.split(/\r?\n/)
  const fencedLines = new Set()
  let fence
  for (const [index, line] of lines.entries()) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      fencedLines.add(index)
      if (
        marker &&
        marker[1][0] === fence[0] &&
        marker[1].length >= fence.length &&
        !marker[2].trim()
      )
        fence = undefined
    } else if (marker && (marker[1][0] === '~' || !marker[2].includes('`'))) {
      fence = marker[1]
      fencedLines.add(index)
    }
  }
  const sectionStart = lines.findIndex(
    (line, index) => !fencedLines.has(index) && line.startsWith(`## [${version}]`),
  )
  if (sectionStart === -1) throw new Error(`CHANGELOG.md has no ${version} section`)
  const heading = lines[sectionStart].match(/^## \[([^\]]+)\] (?:—|-) (\d{4}-\d{2}-\d{2})$/)
  const date = heading?.[2]
  const parsedDate = date && new Date(`${date}T00:00:00Z`)
  if (
    !date ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`CHANGELOG.md section ${version} needs a valid release date`)
  }

  const relativeEnd = lines
    .slice(sectionStart + 1)
    .findIndex((line, index) => !fencedLines.has(sectionStart + 1 + index) && /^## \[/.test(line))
  const sectionEnd = relativeEnd === -1 ? lines.length : sectionStart + 1 + relativeEnd
  const normalizeReference = (label) => label.trim().replace(/\s+/g, ' ').toLowerCase()
  const references = new Map()
  const orderedDefinitions = []
  // Reference-looking lines inside multiline code spans are literal text.
  const codeSpanLines = new Set()
  for (let start = 0; start < lines.length; start += 1) {
    if (fencedLines.has(start)) continue
    let end = start
    while (end + 1 < lines.length && !fencedLines.has(end + 1) && lines[end + 1].trim()) end += 1
    const block = lines.slice(start, end + 1).join('\n')
    const runs = [...block.matchAll(/`+/g)]
    for (let i = 0; i < runs.length; i += 1) {
      const close = runs.findIndex((run, index) => index > i && run[0].length === runs[i][0].length)
      if (close === -1) continue
      const firstLine = start + block.slice(0, runs[i].index).split('\n').length - 1
      const lastLine = start + block.slice(0, runs[close].index).split('\n').length - 1
      for (let line = firstLine + 1; line <= lastLine; line += 1) codeSpanLines.add(line)
      i = close
    }
    start = end
  }
  for (const [index, line] of lines.entries()) {
    if (fencedLines.has(index) || codeSpanLines.has(index)) continue
    const definition = line.match(
      /^ {0,3}\[([^\]]+)\]:\s*(<[^<>]*>|\S+)(?:[ \t]+("[^"\n]*"|'[^'\n]*'|\([^\n]*\)))?[ \t]*$/,
    )
    if (!definition) continue
    const [, label, destination, inlineTitle] = definition
    const nextLineTitle =
      !inlineTitle && lines[index + 1]?.match(/^ {0,3}("[^"\n]*"|'[^'\n]*'|\([^\n]*\))[ \t]*$/)
    const reference = normalizeReference(label)
    // Markdown resolves duplicate definitions to the first occurrence.
    if (!references.has(reference)) {
      references.set(reference, {
        destination: destination.replace(/^<|>$/g, ''),
      })
    }
    orderedDefinitions.push(line)
    if (nextLineTitle) orderedDefinitions.push(lines[index + 1])
  }
  const previousHeading = lines
    .slice(sectionEnd)
    .find(
      (line, index) => !fencedLines.has(sectionEnd + index) && /^## \[(?!Unreleased\])/.test(line),
    )
  const previousVersion = previousHeading?.match(/^## \[([^\]]+)\]/)?.[1]
  const comparison = previousVersion ? `v${previousVersion}...${tag}` : tag
  const changelogUrl = previousVersion
    ? `${repositoryUrl}/compare/${comparison}`
    : `${repositoryUrl}/releases/tag/${tag}`
  if (references.get(normalizeReference(version))?.destination !== changelogUrl) {
    throw new Error(`CHANGELOG.md link for ${version} must match ${changelogUrl}`)
  }

  const sections = new Map()
  const upgradeNotes = []
  let current = upgradeNotes
  for (let index = sectionStart + 1; index < sectionEnd; index += 1) {
    const line = lines[index]
    const categoryHeading = !fencedLines.has(index) && line.match(/^### (.+)$/)
    if (categoryHeading) {
      const category =
        categoryHeading[1] === 'Privacy and security' ? 'Security' : categoryHeading[1]
      if (!categories.includes(category))
        throw new Error(`Unsupported changelog category: ${category}`)
      if (!sections.has(category)) sections.set(category, [])
      current = sections.get(category)
    } else {
      current.push(line)
    }
  }
  const releaseChanges = categories.flatMap((category) => {
    const content = sections.get(category)?.join('\n').trim()
    return content ? [`## ${category}\n\n${content}`] : []
  })
  const upgradeContent = upgradeNotes.join('\n').trim()
  if (upgradeContent) releaseChanges.unshift(`## Upgrade notes\n\n${upgradeContent}`)

  const archive = `elements-${version}-chrome.zip`
  const bytes = await readFile(join(projectRoot, '.output', archive))
  const checksum = createHash('sha256').update(bytes).digest('hex')
  const opening = version.includes('-')
    ? `Elements ${version} is a prerelease distributed as an unsigned Chrome extension archive for testing.`
    : `Elements ${version} is distributed as an unsigned Chrome extension archive.`
  const notes = [
    opening,
    // Keep original definition precedence ahead of categories that may be reordered.
    ...(orderedDefinitions.length ? [orderedDefinitions.join('\n')] : []),
    ...releaseChanges,
    `## Downloads\n\n- [${archive}](${repositoryUrl}/releases/download/${tag}/${archive}): Chrome and compatible Chromium browsers.\n\nThe archive is unsigned. Chrome Web Store distribution requires its signing and\nreview process.\n\nSHA-256:\n\n\`\`\`text\n${checksum}  ${archive}\n\`\`\``,
    `## Full changelog\n\n[${comparison}](${changelogUrl})`,
  ].join('\n\n')

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${notes}\n`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await writeReleaseNotes(join(import.meta.dirname, '..'), process.argv[2], process.argv[3])
  console.log(`Wrote release notes for ${process.argv[2]} to ${process.argv[3]}`)
}
