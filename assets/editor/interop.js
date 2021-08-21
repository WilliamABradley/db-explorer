/* eslint-disable no-unused-vars */
const handle = window.__REACT_WEB_VIEW_BRIDGE || {
  postMessage: () => {},
};

function sendMessage(type, message) {
  const payload = {type, message};
  let encoded;
  try {
    encoded = JSON.stringify(payload);
  } catch (e) {
    console.error(`Failed to Stringify ${type} Message!`);
    return;
  }

  if (type !== 'console') {
    _log(`Sending ${encoded} message`);
  }
  handle.postMessage(encoded);
}

function sendValue(name, value) {
  sendMessage('sendValue', {name, value});
}

function sendEvent(name) {
  sendMessage('event', name);
}

var _log = console.log;
function log(level, message) {
  _log(message);
  sendMessage('console', {
    level,
    message: typeof message === 'string' ? message : JSON.stringify(message),
  });
}
console = {
  log: msg => log('log', msg),
  debug: msg => log('debug', msg),
  info: msg => log('info', msg),
  warn: msg => log('warn', msg),
  error: msg => log('error', msg),
};

window.addEventListener('message', function (payload) {
  var dataPayload;
  try {
    dataPayload = JSON.parse(payload.data);
  } catch (e) {
    throw new Error('Invalid Parent Message');
  }

  if (dataPayload) {
    console.log(`[Parent] ${dataPayload.type}`);
    if (typeof window.receiveMessage === 'function') {
      window.receiveMessage(dataPayload.type, dataPayload.message);
    }
  }
});

window.onerror = function (message, source, lineno, colno, error) {
  sendMessage('fatal', {
    message,
    source,
    lineno,
    colno,
    error,
  });
};

console.log('frame connected');
