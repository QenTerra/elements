# Releasing

## Release text and publication updates

Follow [Release writing](release-writing.md) for the release title and body,
changelog categories, contributor attribution, and publication result format.
Use the complete version in the GitHub Release title; keep any native display
label separate. Prepare and review the body before publication, then read back
the title, body, target, flags, and assets from each affected provider.
A hosted draft still requires publication authority.

## Contract

- Release owner: Nikita Melnychenko (QenTerra)
- Version scheme: Semantic Versioning
- Version source: `package.json`
- Tag form: `v<version>`
- Current version and release: `1.0.0` / `v1.0.0`
- Distribution: unsigned Chrome and Chromium ZIP attached to a GitHub Release

A commit, tag, workflow run, GitHub Release, asset upload, Pages deployment, and
Chrome Web Store submission are separate actions. This guide does not authorise
any of them by itself.

## Prepare

- [ ] Confirm the exact release commit and a clean public checkout.
- [ ] Update `package.json`, the release link and archive name in `README.md`,
      and the dated version section in `CHANGELOG.md` as one coherent change.
- [ ] Document user-visible changes, migrations, known limitations, security
      impact, compatibility, and rollback.
- [ ] Review dependencies, lockfile, third-party notices, permissions, privacy,
      secrets, and GitHub settings.
- [ ] Export a real-user backup only for private acceptance; never add it to the
      repository or test fixtures.

## Verify

Run the complete gate against the intended release tree:

```sh
node scripts/verify-repository.mjs
node --test scripts/release-notes.test.mjs
```

It validates source, dependencies, tests, the production extension, the Pages
site, the tag/version/changelog contract, the release archive, checksum, and
generated notes in an external temporary workspace. Separately complete manual
installation, update, accessibility, visual, real-site, and browser-sync checks
that apply to the release.

## Publish and read back

1. Create the authorised annotated `v<version>` tag at the verified commit.
2. Let `.github/workflows/release.yml` rebuild and test the archive from that
   exact revision.
3. Inspect the release title, notes, target commit, unsigned ZIP name, checksum,
   permissions, and download before treating publication as complete.
4. Compare the remote branch, tag, release target, asset digest, product site,
   and README links with the verified local evidence.

If publication is wrong, stop propagation and preserve evidence. Publish a new
version for corrected immutable content rather than silently replacing history.
