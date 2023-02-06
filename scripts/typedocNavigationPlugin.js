const path = require('path');
const { getPageTitle } = require('typedoc-plugin-markdown/dist/utils/front-matter');

function load(app) {
  app.options.addDeclaration({
    name: 'pagesPattern',
    help: 'A string of pages pattern. The pattern will be tested using RegExp to determine whether the frontmatterData will be added or not.',
    type: 0,
    defaultValue: '',
  });

  app.options.addDeclaration({
    name: 'packageDocsPath',
    help: 'Path to package docs output directory relative to root directory.',
    type: 0,
  });

  app.options.addDeclaration({
    name: 'hierarchyPrefix',
    help: 'Prefix for the value of the `nav` front matter item',
    type: 0,
    default: '',
  });

  const countKey = Symbol('count');
  const hierarchy = {};

  function getLastKey(path, pathNumber = [], currentHierarchy = hierarchy) {
    if (!path.length) {
      if (currentHierarchy[countKey] !== undefined) {
        ++currentHierarchy[countKey];
      } else {
        currentHierarchy[countKey] = 1;
      }

      pathNumber.push(currentHierarchy[countKey]);
      return pathNumber.join('.');
    } else {
      if (currentHierarchy[countKey] === undefined) {
        currentHierarchy[countKey] = 1;
      }

      const currentPath = path[0];
      if (!currentHierarchy[currentPath]) {
        currentHierarchy[currentPath] = {};
        currentHierarchy[countKey]++;
      }

      pathNumber.push(currentHierarchy[countKey]);

      return getLastKey(path.slice(1), pathNumber, currentHierarchy[currentPath]);
    }
  }

  app.renderer.on('endPage', page => {
    const patternStr = app.options.getValue('pagesPattern');
    const pattern = new RegExp(patternStr);

    if (!pattern.test(page.filename)) {
      return;
    }

    const docsPath = path.resolve(__dirname, '..', app.options.getValue('packageDocsPath'));
    const docRelativePath = path.relative(docsPath, page.filename);
    const splittedPath = docRelativePath.split('/');
    const currentPrefix = splittedPath.slice(0, -1);

    let nav = getLastKey(currentPrefix);
    const hierarchyPrefix = app.options.getValue('hierarchyPrefix');
    if (hierarchyPrefix) {
      nav = `${hierarchyPrefix}.${nav}`;
    }

    const splittedRawTitle = getPageTitle(page).split(' ');
    let title = splittedRawTitle.at(-1);

    if (title === '@100mslive/hms-video-store') {
      title = 'Web SDK API Reference'; // for the root content.mdx
      nav += '.1'
    } else if (title === '@100mslive/react-sdk') {
      title = 'React Hooks API Reference'; // for the root content.
      nav += '.1'
    }

    const frontmatterDataEntries = Object.entries({ title, nav });

    let frontmatterStr = `---\n`;

    for (const [key, value] of frontmatterDataEntries) {
      frontmatterStr += `${key}: ${value}\n`;
    }

    frontmatterStr += `---\n\n`;

    page.contents = frontmatterStr + page.contents;
  });
}

module.exports = { load };
