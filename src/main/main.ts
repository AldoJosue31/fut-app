/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
let mainWindow: BrowserWindow | null = null;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// IPC handler
ipcMain.handle('ipc-example', async (_event, arg: string) => {
  const response = `IPC test: ${arg}`;
  log.info(response);
  return `IPC test: pong`;
});

if (isDebug) {
  require('source-map-support').install();
  require('electron-debug')();
}

const installExtensions = async () => {
  if (!isDebug) return;
  const { default: installer, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
  const forceDownload = Boolean(process.env.UPGRADE_EXTENSIONS);

  try {
    await installer([REACT_DEVELOPER_TOOLS], { forceDownload });
  } catch (err) {
    log.warn('Extension install failed:', err);
  }
};

const createWindow = async () => {
  await installExtensions();

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.resolve(__dirname, '../../assets');

  const getAsset = (...paths: string[]) => path.join(RESOURCES_PATH, ...paths);

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    show: false,
    icon: getAsset('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      contextIsolation: true,      // <-- Añadido
      enableRemoteModule: false,   // <-- Añadido
      nodeIntegration: false       // <-- Añadido
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.once('ready-to-show', () => {
    if (process.env.START_MINIMIZED) {
      mainWindow?.minimize();
    } else {
      mainWindow?.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  new MenuBuilder(mainWindow).buildMenu();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (!isDebug) new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady()
  .then(createWindow)
  .then(() => {
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch(err => log.error(err));
