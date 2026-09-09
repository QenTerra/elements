#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

const packageJson = JSON.parse(
  await readFile(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
)
const projectRoot = join(import.meta.dirname, '..')
const changelog = await readFile(join(projectRoot, 'CHANGELOG.md'), 'utf8')
const readme = await readFile(join(projectRoot, 'README.md'), 'utf8')
const tag = process.argv[2]
const expected = `v${packageJson.version}`

if (!tag) throw new Error(`Release tag is required; expected ${expected}`)
if (tag !== expected)
  throw new Error(`Release tag ${tag} does not match package version ${expected}`)

const escapedVersion = packageJson.version.replaceAll('.', '\\.')
const releaseHeader = new RegExp(`^## \\[${escapedVersion}\\] (?:—|-) (\\d{4}-\\d{2}-\\d{2})$`, 'm')
const match = changelog.match(releaseHeader)
if (!match) {
  throw new Error(
    `CHANGELOG.md needs a dated ${packageJson.version} section before ${expected} can be released`,
  )
}

const archive = `elements-${packageJson.version}-chrome.zip`
if (!readme.includes(archive)) throw new Error(`README.md does not mention ${archive}`)

console.log(
  `Release ${tag} matches package version ${packageJson.version} and changelog date ${match[1]}.`,
)
