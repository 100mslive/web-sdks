module.exports = async ({ github, context }) => {
  const { CHANGES } = process.env;

  const {
    repo: { owner, repo },
    issue: { number: issue },
  } = context;

  const currentLabels = await github.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number: issue,
  });
  console.log({ currentLabels, CHANGES });
};
