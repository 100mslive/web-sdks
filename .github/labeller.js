module.exports = async ({ github, context, core }) => {
  const { CHANGES } = process.env;

  const currentLabels = await github.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number,
  });
  console.log({ currentLabels, CHANGES });
};
