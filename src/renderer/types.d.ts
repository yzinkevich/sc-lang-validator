declare global {
  interface Window {
    electron: {
      selectDirectory: () => Promise<string | null>;
      validateFiles: (directory: string, keys: string[]) => Promise<{
        file: string;
        missingKeys: string[];
        emptyTranslations: string[];
      }[]>;
      checkDirectory: (directory: string) => Promise<boolean>;
    }
  }
}

export {}; 