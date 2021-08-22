/// <reference path="./monaco-editor/monaco.d.ts" />

declare function sendMessage(type: string, message?: any): void;
declare function receiveMessage(type: string, message?: any): void;

declare function sendValue(name: string, value: any): void;

declare var _monacoInfo: any;
declare var editor: monaco.editor.IStandaloneCodeEditor;
declare var model: monaco.editor.ITextModel;
