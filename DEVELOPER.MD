### This file is meant for folks working on this repo.

> "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.
> Code for readability." - John Woods

## Coding Guidelines

- Prefer readability and maintenance over anything else.
- Performance is the second preference, think of what happens when there
  are ten thousand people in the room, what happens when there are two thousand
  roles in the room. Don't optimise prematurely but don't iterate or create copies
  unnecessarily.
- Use whole words in names, descriptive over cryptic names.
  The reader shouldn't have to pause and decipher what a variable might be 
  holding, a function might be doing.
    ```ts
    let lYrCnt = 5; // ❌
    let leapYearCount = 5; // ✅
    ```
- Don't use unclear **generic variable names**.
  ```ts
  for (let item of peers) {} // ❌
  for (let peer of peers) {} // ✅
  
  Object.entries(tracksMap).forEach((key, val) => {}) // ❌
  Object.entries(tracksMap).forEach((trackId, track) => {}) // ✅
  ```
- If any question related to the code is discussed in Slack, PR comments
  etc. add it as a comment, or make the code readable enough, so the question
  is answered by the code.
- Within a file, type definitions should come first.
- Withing a class order of functions is public, protected and private.
- Use undefined over null if you need to pick one.
- Anything requiring logic, or algo should stay outside of React Lifecycle
  in a framework agnostic class. React Components if needed will only be a thin
  wrapper over the core logic.
- Use **TSDoc** extensively especially for public APIs, document interfaces, fields
  etc. so there is no ambiguity, or lack of clarity for the developer using it.
- Internal utility classes and helpers should be given the same due diligence as
  external APIs, with respect to a well-defined API and proper documentation.
- Think of some possible ways the thing you're working on can evolve in the future.
  Design you code such that it's extensible and easy to update especially if you're not the person
  doing those future changes.
- Internal APIs, util functions etc. should also be documented properly, every class
  or a non trivial function should ideally have a yes answer to - "Will an external
  user be able to know what is this doing if we make this public?".
- **Explicitness over Implicitness** - code should be explicit of its intent,
  use variables to abstract conditions, 
- **Single Source of Truth** for business logic. For e.g. let's say that
  there are two peer related components who want to do sth special based on
  a condition. Both shouldn't independently evaluate the condition, either
  they should be sent the variable from a parent or have the condition isolated
  in a separate outside function. Why - 
  - The fact that both components are linked is now expressed in code.
  - Changing the condition in future doesn't require being aware of what
    all places it's being used. It's clear from code.
- **No Surprises** - this is a follow up on explicitness, code should be easy
  to reason about. Changing one part shouldn't break other. Every link should be
  explicitly put in code, every behaviour documented.
- **Decoupled** - This will usually happen if above are in place. One piece shouldn't 
  rely on internal details of how some other piece is working. And similarly, primitive
  pieces shouldn't decide things for their parent/users. If they start getting used in
  multiple places, changing sth simple will have a lot of unintended effects. If in 
  doubt about a field, let the parent pass it. Questions to ask about the new code - 
  - Can it be used as it is in a different context?
  - Does this function know about its caller? // it shouldn't
  - If we change the implementation of this piece in future without changing
  its public API, will the caller/user need to know?
  - Can we unit test this piece in isolation?
- **No Hacks** - Take time to understand the problem, and the root cause. Don't try
  to start on solving a problem if you don't understand the cause. Take time but don't
  put workarounds. The first step is figuring out the root cause, solving it is the second
  step.
  - If you are messing around with different inputs on UI side and found a
  hack that works, it doesn't solve the underlying problem which is sth is fundamentally
  broken with our packages.
- **Refactor** - Every change, new feature should be simple to do in good code. If it's
  not refactor it in a PR, so it becomes simple and then do the simple change. If you
  find yourself copy pasting code refactor. Don't repeat yourself.

## Coding Guidelines(SDK, Store)

- Do not use I as a prefix for interface names. There are some existing
  interfaces following this which can't be changed now.
- Use camelCase for function names.
- Use PascalCase for enum values and type names.
- Don't use

## Coding Guidelines(react-sdk)

- Don't suppress any errors, take explicit error handler
- Interfaces for input and result if they have more than 2 fields
- input and output should be object if there are more than 2 fields
  or you foresee it having more than two fields

## Coding Guidelines(react-ui)

- Composibility is the most important factor, don't export `Dialog<title, body`,
  export `Dialog.Root`, `Dialog.Header`, `Dialog.Title`, `Dialog.Close`, `Dialog.Body`,
  `Dialog.Footer`.
- Consistency - the top level child for any component is called root and
  so on, refer to similar existing components.
- There shouldn't be any media query based on viewport in react-ui, 
  media queries. The problem with this is that they are based on the
  size of whole page than the size of parent and even if they look good
- No fixed height, width in pixels, avoid anything in pixels
- There is almost always a better and more responsive solution using
  css properties than going for pixel based dimensions or media queries.


## Coding Guidelines(100ms-web, 100ms-custom-app)

- Everything react related from above
- Write code which is easy to read, understand and customise not only as a whole
  piece but also when broken down in multiple pieces
- No quick POCs with hacky code for merging to main
  - the repo is public, we don't want bad looking code here
  - once code is merged it rarely gets a revisit
  - bad code spirals out of control, it encourages not ensuring code quality for future developers
- The repo will act as the base where some of our customers may start from.
  With this in mind ensure below - 
  - High Code quality
  - No long files
  - No implicit links. Beware of thoughts like these while writing code -
    - we're putting only a left margin here because this
    component we're using already puts a right margin.
    - even though these are similar components only one will show because of how they
      are internally using media queries.
- The repo also serves as a public reference for
  people implementing in their own app. With that in mind, components
  should be well documented and designed with a good public API. Ensure below -
  - Components shouldn't be context specific, no component should be aware of 
    whose child it's going to be or who are going to be its sibling components.
  - Every file is more or less standalone and easy to understand
  - Components should be written for copy pasting not just to work in our UI. People
  should be able to have it working in their UI without any surprises.
    

