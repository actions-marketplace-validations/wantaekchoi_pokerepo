// What counts as caught and as a merge. Only facts GitHub itself recorded are used —
// no reading of commit titles, bodies or comments.

/**
 * A repository is caught when your work is in it.
 * Your own repository counts as yours. Anywhere else, the test is GitHub's authorship record:
 * a commit you authored on the default branch. Maintainers who rebase, reword or fold your
 * commit into their own pull request keep the author, so an accepted contribution is caught
 * whether or not the pull request shows as merged.
 */
export const isCaught = ({ own, merges, commits }) => own || merges > 0 || commits > 0;

/**
 * Pull requests that count as merged in one repository: merged ones, plus closed ones that
 * GitHub records as closed by a commit you authored ("Closes #n" in a commit that landed).
 * A pull request closed by hand has no such record, so its commits still catch the repository
 * but it adds no merge.
 */
export const mergeCount = (pulls) => pulls.filter((p) => p.merged || p.closedByMyCommit).length;
