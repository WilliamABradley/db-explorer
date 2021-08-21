/// <reference path="./monaco-editor/monaco.d.ts" />

declare function sendMessage(type: string, message: string): void;
declare function receiveMessage(type: string, message: string): void;

declare function sendValue(name: string, value: any): void;

declare var editor: monaco.editor.IStandaloneCodeEditor;
declare var model: monaco.editor.IEditorModel;
