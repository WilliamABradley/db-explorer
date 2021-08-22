/* eslint-disable no-unused-vars */
function getHandle() {
  return window.ReactNativeWebView || window.__REACT_WEB_VIEW_BRIDGE;
}

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

  const handle = getHandle();
  handle && handle.postMessage(encoded);
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
    // Ignore vscode messages.
    if (typeof payload.data === 'object' && payload.data.vscodeSetImmediateId) {
      return;
    }
    dataPayload = JSON.parse(payload.data);
  } catch (e) {
    throw new Error(`Invalid Parent Message: ${JSON.stringify(payload.data)}`);
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
