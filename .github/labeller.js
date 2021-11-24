module.exports = async ({ github, context }) => {
  const { CHANGES } = process.env;

  const {
    repo: { owner, repo },
    issue: { number: issue },
  } = context;

  const changes = JSON.parse(CHANGES);
  const labelsToAdd = [];
  for (const key in changes) {
    if (changes[key] === 'true') {
      labelsToAdd.push(key);
    }
  }

  await github.rest.issues.setLabels({
    owner,
    repo,
    issue_number: issue,
    labels: labelsToAdd,
  });
};
