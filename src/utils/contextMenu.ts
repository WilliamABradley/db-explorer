import {NativeModules, NativeEventEmitter} from 'react-native';

type ContextMenuHandle = {
  openContextMenu(): void;
};

const handle: ContextMenuHandle = NativeModules.ContextMenu;

export function supportsContextMenu() {
  return !!handle;
}

export function openContextMenu() {
  handle?.openContextMenu();
}
