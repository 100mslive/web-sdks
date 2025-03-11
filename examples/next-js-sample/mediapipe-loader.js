module.exports = function (source) {
  if (!source.includes('exports.SelfieSegmentation')) {
    source += '\nexports.SelfieSegmentation = SelfieSegmentation;';
  }
  return source;
};
