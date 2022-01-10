module.exports = async ({ github, context }) => {
  const { CHANGES } = process.env;

  const {
    repo: { owner, repo },
    issue: { number: issue },
  } = context;

  /**
   * CHANGES will have the mapping set in apply-label.yml as a key and a stringifed bool value
   * indicating whether the files in that filter has changed. Use the key as label for
   * which the value is 'true'
   */
  const changes = JSON.parse(CHANGES);
  const labelsToAdd = [];
  for (const key in changes) {
    if (changes[key] === 'true') {
      labelsToAdd.push(key);
    }
  }

  // This will update the labels - add if missing, delete if not present
  await github.rest.issues.setLabels({
    owner,
    repo,
    issue_number: issue,
    labels: labelsToAdd,
  });
};
