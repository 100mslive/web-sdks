export function removeQuotes(str) {
  return str.replace(/^"(.*)"$/, "$1");
}

export function parseTagsList(tagList) {
  const tagMap = {};
  for (const tags of tagList) {
    if (tagMap[tags[0]]) {
      tagMap[tags[0]].push(removeQuotes(tags[1]));
    } else {
      tagMap[tags[0]] = [removeQuotes(tags[1])];
    }
  }
  const result = {
    rawTags: {
      ...tagMap,
    },
    duration: Number(tagMap["INF"][0]),
    fragmentStartAt: parseISOString(tagMap["PROGRAM-DATE-TIME"][0]),
  };
  return result;
}

export function parseMetadataString(mtStr) {
  const splitAtComma = mtStr.split(",");

  const tagMap = {};
  for (const tags of splitAtComma) {
    const splitAtEquals = tags.split("=");

    tagMap[splitAtEquals[0]] = removeQuotes(splitAtEquals[1]);
  }

  return {
    duration: tagMap["DURATION"],
    id: tagMap["ID"],
    starTime: parseISOString(tagMap["START-DATE"]),
    payload: tagMap["X-100MSLIVE-PAYLOAD"],
  };
}

export function getSecondsFromTime(time) {
  return time.getHours() * 60 * 60 + time.getMinutes() * 60 + time.getSeconds();
}

/** doesn't account for timezones.
 * Do not use for dates. Only accurate for time */
export function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

export function isMetadataAlreadyInTimeTable(fragsTimeStamps, tagMetadata) {
  const alreadyExistingmetadata = fragsTimeStamps.filter(
    fragsTimeStamp => fragsTimeStamp.id === tagMetadata.id
  );

  return !!alreadyExistingmetadata.length;
}
