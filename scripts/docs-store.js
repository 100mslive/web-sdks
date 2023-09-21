const fs = require('fs');

/**
 * Return an array of paths of all the files in a given directory
 * @param {string} path
 * @param {string[]} arrayOfFiles
 * @returns {string[]}
 */
const getFiles = (path, arrayOfFiles = []) => {
  fs.readdirSync(path).forEach(file => {
    const filePath = `${path}/${file}`;
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

/**
 * Replace the title with metadata given the content of a file
 * @param {string | undefined} content
 * @returns {string | undefined}
 */
const replaceTitleWithMetadata = content => {
  const lines = content?.split('\n');
  const firstLine = lines?.at(0);
  if (!lines || !firstLine) {
    return;
  }
  const firstLineParts = firstLine.split(' ');
  let title = firstLineParts.at(2) || firstLineParts.at(1);
  if (title === '@100mslive/hms-video-store') {
    title = 'Web SDK API Reference'; // for the root content.mdx
  } else if (title === '@100mslive/react-sdk') {
    title = 'React Hooks API Reference'; // for the root content.
  }
  const meta = `---\ntitle: ${title}\n---`;
  lines.splice(0, 1, meta);
  return lines.join('\n');
};

/**
 * Remove .md extension from all links used in a file
 * @param {string | undefined} content
 * @returns {string | undefined}
 */
const removeFileExtensionFromLinks = content => {
  return content?.replace(/.md/g, '');
};

/**
 * Replace /modules with /home/content in links
 * @param {string | undefined} content
 * @returns {string | undefined}
 */
const replaceContentLinks = content => {
  return content?.replace(/\/modules/g, '/home/content');
};

const main = () => {
  getFiles('docs').forEach(async filePath => {
    const content = fs.readFileSync(filePath, { encoding: 'utf8' });
    const newContent = removeFileExtensionFromLinks(replaceContentLinks(content));
    if (newContent) {
      fs.writeFileSync(filePath, newContent);
    }
  });
};

main();
