/* eslint-disable complexity */
/**
 * Performs recursive merging of object by comparing keys. The last object's key will be the final winner
 * when keys clash.
 * @param result - Object where the result of the operation is stored
 * @param rest: any[] -  pass objects that are to be merged in result
 * @returns {Record<string, any>} merged object
 */
export default function deepMerge(result: Record<string, any>, ...rest: any[]) {
  const stack = rest;
  let item;
  let key;
  while (stack.length) {
    item = stack.shift();
    for (key in item) {
      // eslint-disable-next-line no-prototype-builtins
      if (item.hasOwnProperty(key)) {
        if (typeof result[key] === 'object' && result[key] && !Array.isArray(result[key])) {
          if (typeof item[key] === 'object' && item[key] !== null) {
            result[key] = deepMerge({}, result[key], item[key]);
          } else {
            result[key] = item[key];
          }
        } else {
          result[key] = item[key];
        }
      }
    }
  }
  return result;
}
