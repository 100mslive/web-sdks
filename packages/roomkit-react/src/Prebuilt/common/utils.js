import { QUESTION_TYPE } from './constants';

// eslint-disable-next-line complexity
export function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).length === 1 ? `0${R.toString(16)}` : R.toString(16);
  const GG = G.toString(16).length === 1 ? `0${G.toString(16)}` : G.toString(16);
  const BB = B.toString(16).length === 1 ? `0${B.toString(16)}` : B.toString(16);

  return `#${RR}${GG}${BB}`;
}

/**
 * TODO: this is currently an O(N**2) function, don't use with peer lists, it's currently
 * being used to find intersection between list of role names where the complexity shouldn't matter much.
 */
export const arrayIntersection = (a, b) => {
  if (a === undefined || b === undefined) {
    return [];
  }
  // ensure "a" is the bigger array
  if (b.length > a.length) {
    let t = b;
    b = a;
    a = t;
  }
  return a.filter(function (e) {
    return b.indexOf(e) > -1;
  });
};

export const getMetadata = metadataString => {
  try {
    return !metadataString ? {} : JSON.parse(metadataString);
  } catch (error) {
    return {};
  }
};

export const metadataProps = function (peer) {
  return {
    isHandRaised: getMetadata(peer.metadata)?.isHandRaised,
  };
};

export const isScreenshareSupported = () => {
  return typeof navigator.mediaDevices.getDisplayMedia !== 'undefined';
};

export const metadataPayloadParser = payload => {
  try {
    const data = window.atob(payload);
    const parsedData = JSON.parse(data);
    return parsedData;
  } catch (e) {
    return { payload };
  }
};

// For bottom action sheet, returns updated height based on drag
export const getUpdatedHeight = (e, MINIMUM_HEIGHT) => {
  const heightToPercentage = 100 - ((e?.touches?.[0] || e).pageY / window.innerHeight) * 100;
  // Snap to top if height > 80%, should be at least 40vh
  const sheetHeightInVH = Math.max(MINIMUM_HEIGHT, heightToPercentage > 80 ? 100 : heightToPercentage);
  return `${sheetHeightInVH}vh`;
};

export const getFormattedCount = num => {
  const formatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 });
  const formattedNum = formatter.format(num);
  return formattedNum;
};

export const formatTime = timeInSeconds => {
  timeInSeconds = Math.floor(timeInSeconds / 1000);
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  const hour = hours !== 0 ? `${hours < 10 ? '0' : ''}${hours}:` : '';
  return `${hour}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const compareArrays = (a, b) => {
  if (a.length !== b.length) return false;
  else {
    // Comparing each element of your array
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
};

export const checkCorrectAnswer = (answer, localPeerResponse, type) => {
  if (type === QUESTION_TYPE.SINGLE_CHOICE) {
    return answer?.option === localPeerResponse?.option;
  } else if (type === QUESTION_TYPE.MULTIPLE_CHOICE) {
    return answer?.options && localPeerResponse?.options && compareArrays(answer?.options, localPeerResponse?.options);
  }
};

export const isValidTextInput = (text, minLength = 1, maxLength = 100) => {
  return text && text.length >= minLength && text.length <= maxLength;
};

export const calculateAvatarAndAttribBoxSize = (calculatedWidth, calculatedHeight) => {
  if (!calculatedWidth || !calculatedHeight) {
    return [undefined, undefined];
  }

  let avatarSize = 'large';
  if (calculatedWidth <= 150 || calculatedHeight <= 150) {
    avatarSize = 'small';
  } else if (calculatedWidth <= 300 || calculatedHeight <= 300) {
    avatarSize = 'medium';
  }

  let attribBoxSize = 'medium';
  if (calculatedWidth <= 180 || calculatedHeight <= 180) {
    attribBoxSize = 'small';
  }

  return [avatarSize, attribBoxSize];
};

export const isMobileUserAgent = /Mobi|Android|iPhone/i.test(navigator.userAgent);

export const getPeerResponses = (questions, peerid, userid) => {
  return questions.map(question =>
    question.responses?.filter(
      response =>
        ((response && response.peer?.peerid === peerid) || response.peer?.userid === userid) && !response.skipped,
    ),
  );
};

export const getLastAttemptedIndex = (questions, peerid, userid = '') => {
  const peerResponses = getPeerResponses(questions, peerid, userid) || [];
  for (let i = 0; i < peerResponses.length; i++) {
    // If another peer has attempted, undefined changes to an empty array
    if (peerResponses[i] === undefined || peerResponses[i].length === 0) {
      // Backend question index starts at 1
      return i + 1;
    }
  }
  // To indicate all have been attempted
  return questions.length + 1;
};

export const getPeerParticipationSummary = (poll, localPeerID, localCustomerUserID) => {
  let correctResponses = 0;
  let score = 0;
  const questions = poll.questions || [];
  const peerResponses = getPeerResponses(questions, localPeerID, localCustomerUserID);
  let totalResponses = peerResponses.length || 0;

  peerResponses.forEach(peerResponse => {
    if (!peerResponse?.[0]) {
      return;
    }
    const isCorrect = checkCorrectAnswer(
      questions[peerResponse[0].questionIndex - 1].answer,
      peerResponse[0],
      questions[peerResponse[0].questionIndex - 1].type,
    );
    if (isCorrect) {
      score += questions[peerResponse[0].questionIndex - 1]?.weight || 0;
      correctResponses++;
    }
  });
  return { totalResponses, correctResponses, score };
};
