import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

declare const __dirname: string;
declare const process: NodeJS.Process;

function createWindow() {
  console.log('Creating window...');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  console.log('Preload path:', path.join(__dirname, 'preload.js'));
  console.log('HTML path:', path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.webContents.openDevTools();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0] || null;
});

const IGNORED_LANG_FILES = ['lang_longlish.json', 'lang_comment.json'];

async function validateFiles(directory: string, keys: string[]) {
  try {
    const files = await fs.readdir(directory);
    const langFiles = files
      .filter((file: string) => file.startsWith('lang_') && file.endsWith('.json'))
      .filter((file: string) => !IGNORED_LANG_FILES.includes(file));
    
    if (langFiles.length === 0) {
      throw new Error('NO_JSON_FILES');
    }

    const results = await Promise.all(langFiles.map(async (file: string) => {
      const filePath = path.join(directory, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(content);
      
      const langTranslations = translations[Object.keys(translations)[0]];
      
      const missingKeys = keys.filter(key => !(key in langTranslations));
      const emptyTranslations = keys
        .filter(key => key in langTranslations)
        .filter(key => !langTranslations[key]);
      
      return {
        file,
        missingKeys,
        emptyTranslations
      };
    }));
    
    return results;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'NO_JSON_FILES') {
      throw error;
    }
    throw new Error('VALIDATION_ERROR');
  }
}

ipcMain.handle('validate-files', async (event, directoryPath: string, keys: string[]) => {
  try {
    return await validateFiles(directoryPath, keys);
  } catch (error) {
    console.error('Error validating files:', error);
    throw error;
  }
});

ipcMain.handle('check-directory', async (_, directory: string) => {
  try {
    const files = await fs.readdir(directory);
    const langFiles = files
      .filter(file => file.startsWith('lang_') && file.endsWith('.json'))
      .filter(file => !IGNORED_LANG_FILES.includes(file));
    
    return langFiles.length > 0;
  } catch (error) {
    console.error('Error checking directory:', error);
    throw error;
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
}); 