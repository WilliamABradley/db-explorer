/* eslint-disable no-undef */
// Supress updates to selection when making edits.
var modifyingSelection = false;

function connectInteractions() {
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
}
