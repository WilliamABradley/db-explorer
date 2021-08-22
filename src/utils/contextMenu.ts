import {NativeModules, NativeEventEmitter} from 'react-native';

type ContextMenuHandle = {
  openContextMenu(x: number, y: number): void;
};

const handle: ContextMenuHandle = NativeModules.ContextMenu;

export function supportsContextMenu() {
  return !!handle;
}

export function openContextMenu(x: number, y: number) {
  if (!handle) {
    console.error('Context Menu Handler not registered');
  }
  handle?.openContextMenu(x, y);
}
