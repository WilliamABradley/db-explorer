/* eslint-disable no-undef */
// @ts-check
/// <reference path="./Global.d.ts" />
/// <reference path="./monaco-editor/monaco.d.ts" />
/// <reference lib="dom" />

// Supress updates to selection when making edits.
var modifyingSelection = false;
var overrideContextMenu = true;

/**
 *
 * @param {HTMLElement} element
 * @returns {monaco.editor.IEditor}
 */
function init(element) {
  editor = monaco.editor.create(element, {
    value: `var info = ${JSON.stringify(_monacoInfo, null, 2)}`,
    language: 'javascript',
    minimap: {
      enabled: false,
    },
    contextmenu: !overrideContextMenu,
  });

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
    sendValue('Text', model.getValue());
    //console.log("buffers: " + JSON.stringify(model._buffer._pieceTree._buffers));
    //console.log("commandMgr: " + JSON.stringify(model._commandManager));
    //console.log("viewState:" + JSON.stringify(editor.saveViewState()));
  });

  // Listen for Selection Changes
  editor.onDidChangeCursorSelection(event => {
    if (!modifyingSelection) {
      console.log(event.source);
      sendValue('SelectedText', model.getValueInRange(event.selection));
      sendValue('SelectedRange', JSON.stringify(event.selection));
    }
  });

  editor.onContextMenu(event => {
    if (overrideContextMenu) {
      sendMessage('contextMenu', event);
      event.event.stopPropagation();
    }
  });

  return editor;
}

/**
 * @param {string} type
 * @param {any|undefined} message
 */
function receiveMessage(type, message) {
  switch (type) {
    case 'updateOptions':
      /** @type {Parameters<monaco.editor.IStandaloneCodeEditor['updateOptions']>[0]} */
      const options = message;
      editor.updateOptions(options);
      if (options.contextmenu !== undefined) {
        overrideContextMenu = !options.contextmenu;
      }
      break;

    default:
      console.warn(`Unknown Message Type: ${type}`);
      break;
  }
}
