import { createRoot } from 'react-dom/client';

import { Style } from './styles/styles.css';

import { router } from "./Router";
import { RouterProvider } from 'react-router-dom';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<RouterProvider router={router}/>);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
