/// <reference path="./Global.d.ts" />
/// <reference path="./monaco-editor/monaco.d.ts" />

/* eslint-disable no-undef */
// Supress updates to selection when making edits.
var modifyingSelection = false;
var overrideContextMenu = false;

function init(element) {
  editor = monaco.editor.create(element, {
    value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
    language: 'javascript',
    minimap: {
      enabled: false,
    },
  });

  // Update Monaco Size when we receive a window resize event
  window.addEventListener('resize', () => {
    editor.layout();
  });

  model = editor.getModel();

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
      sendValue('SelectedRange', JSON.stringify(event.selection), 'Selection');
    }
  });

  /*   editor.onContextMenu(event => {
    if (overrideContextMenu) {
      sendMessage('contextMenu', event);
      event.event.stopPropagation();
    }
  }); */

  return editor;
}

function receiveMessage(type, message) {
  switch (type) {
    case 'UpdateOptions':
      editor.updateOptions(message);
      break;

    /*     case 'OverrideContextMenu':
      overrideContextMenu = message == 'true';
      break; */

    default:
      console.warn(`Unknown Message Type: ${type}`);
      break;
  }
}
