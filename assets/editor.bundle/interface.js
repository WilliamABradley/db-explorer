/* eslint-disable no-undef */
// @ts-check
/// <reference path="./Global.d.ts" />
/// <reference path="./monaco-editor/monaco.d.ts" />
/// <reference lib="dom" />

// Supress updates to selection when making edits.
var modifyingSelection = false;
var overrideContextMenu = true;

/**
 * @param {string} type
 * @param {any|undefined} message
 */
function receiveMessage(type, message) {
  switch (type) {
    case 'init':
      init(message);
      break;

    case 'updateOptions':
      /** @type {Parameters<monaco.editor.IStandaloneCodeEditor['updateOptions']>[0]} */
      const updateOptions = message;
      editor.updateOptions(updateOptions);
      if (updateOptions.contextmenu !== undefined) {
        overrideContextMenu = !updateOptions.contextmenu;
      }
      break;

    case 'setValue':
      editor.setValue(message);
      break;

    default:
      console.warn(`Unknown Message Type: ${type}`);
      break;
  }
}

/**
 * @param {monaco.editor.IStandaloneEditorConstructionOptions} options
 */
function init(options) {
  editor = monaco.editor.create(document.getElementById('container'), options);

  // Update Monaco Size when we receive a window resize event
  window.addEventListener('resize', () => {
    editor.layout();
  });

  const _model = editor.getModel();
  if (_model) {
    model = _model;
  }

  // Listen for Content Changes
  model.onDidChangeContent(event => {
    sendMessage('setValue', model.getValue());
  });

  // Listen for Selection Changes
  editor.onDidChangeCursorSelection(event => {
    if (!modifyingSelection) {
      sendMessage('selectedText', model.getValueInRange(event.selection));
      sendMessage('selectedRange', JSON.stringify(event.selection));
    }
  });

  editor.onContextMenu(event => {
    sendMessage('contextMenu', event);
    event.event.stopPropagation();
  });

  sendMessage('initialised');
}
