import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectDirectory: async () => {
    try {
      return await ipcRenderer.invoke('select-directory');
    } catch (error) {
      console.error('Error in selectDirectory:', error);
      throw error;
    }
  },
  validateFiles: async (directoryPath: string, keys: string[]) => {
    try {
      return await ipcRenderer.invoke('validate-files', directoryPath, keys);
    } catch (error) {
      console.error('Error in validateFiles:', error);
      throw error;
    }
  },
  checkDirectory: async (directory: string) => {
    return await ipcRenderer.invoke('check-directory', directory);
  },
}); 