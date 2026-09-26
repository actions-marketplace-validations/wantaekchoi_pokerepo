// Cases measured on real repositories on 2026-09-26. Run with: node --test
import assert from 'node:assert/strict';
import test from 'node:test';
import { isCaught, mergeCount } from '../src/rules.mjs';

test('a pull request a maintainer rebased in and closed by hand is caught by its commit', () => {
  // spring-projects/spring-ai#6803: closed without a commit record, commit 2e27276ee authored by you
  const pulls = [{ number: 6803, state: 'closed', merged: false, closedByMyCommit: false }];
  assert.equal(mergeCount(pulls), 0);
  assert.equal(isCaught({ own: false, merges: mergeCount(pulls), commits: 1 }), true);
});

test('a pull request GitHub records as closed by your landed commit counts as a merge', () => {
  // spring-projects/spring-data-jpa#4335 closed by c6b5347f7, with #4336 still open
  const pulls = [
    { number: 4335, state: 'closed', merged: false, closedByMyCommit: true },
    { number: 4336, state: 'open', merged: false },
  ];
  assert.equal(mergeCount(pulls), 1);
  assert.equal(isCaught({ own: false, merges: mergeCount(pulls), commits: 1 }), true);
});

test('a commit folded into a maintainer pull request catches the repository without a merge', () => {
  // MyEtherWallet/MyEtherWallet#4558 closed; its commit landed through the maintainer's #4565
  const pulls = [{ number: 4558, state: 'closed', merged: false, closedByMyCommit: false }];
  assert.equal(mergeCount(pulls), 0);
  assert.equal(isCaught({ own: false, merges: 0, commits: 1 }), true);
});

test('an open pull request with nothing landed is only seen', () => {
  // nasa/earthdata-search#2084
  assert.equal(isCaught({ own: false, merges: mergeCount([{ state: 'open', merged: false }]), commits: 0 }), false);
});

test('a closed pull request with nothing landed is only seen', () => {
  assert.equal(isCaught({ own: false, merges: mergeCount([{ state: 'closed', merged: false, closedByMyCommit: false }]), commits: 0 }), false);
});

test('merged pull requests count as before', () => {
  const pulls = [{ merged: true }, { merged: true }, { merged: false, closedByMyCommit: false }];
  assert.equal(mergeCount(pulls), 2);
});

test('your own repository is caught even before its first commit', () => {
  assert.equal(isCaught({ own: true, merges: 0, commits: 0 }), true);
});
