### Tech Debt

- tsdx is becoming an issue, the jest version with tsdx is pretty old and also
  links to a vulnerable node-modifier package. Some discussion here - https://github.com/formium/tsdx/issues/1068
- node-notifier is force updated using yarn resolutions to handle dependabot alerts

- an optimization focused review needs to be done on core parts to handle thousands
  of peers at a time
