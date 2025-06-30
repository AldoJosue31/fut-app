// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

// Expose general electron IPC handler
contextBridge.exposeInMainWorld('electron', electronHandler);

// Expose authentication API
contextBridge.exposeInMainWorld('electronAuth', {
  signUp: (email: string, password: string) =>
    ipcRenderer.invoke('auth:signUp', { email, password }),
  signIn: (email: string, password: string) =>
    ipcRenderer.invoke('auth:signIn', { email, password }),
  signOut: () =>
    ipcRenderer.invoke('auth:signOut'),
  getSession: () =>
    ipcRenderer.invoke('auth:getSession'),
});

export type ElectronHandler = typeof electronHandler;
