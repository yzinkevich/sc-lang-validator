import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  CssBaseline,
  IconButton,
  Divider,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip
} from '@mui/material';
import {
  FolderOpen,
  Check,
  Error as ErrorIcon,
  ContentCopy,
  Refresh,
  DarkMode,
  LightMode,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ViewList,
  ViewModule,
  InfoOutlined
} from '@mui/icons-material';
import styled from '@emotion/styled';

const StyledContainer = styled(Container)`
  padding-top: 2rem;
  padding-bottom: 2rem;
`;

const StyledPaper = styled(Paper)`
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

interface ValidationResult {
  file: string;
  missingKeys: string[];
  emptyTranslations: string[];
}

type ViewMode = 'byFile' | 'byKey';

interface DuplicateInfo {
  key: string;
  count: number;
}

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');
  const [showAllKeys, setShowAllKeys] = useState(false);
  const [recentDirectories, setRecentDirectories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recentDirectories');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const [inputText, setInputText] = useState<string>('');
  const [extractedKeys, setExtractedKeys] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('byFile');
  const [duplicateKeys, setDuplicateKeys] = useState<DuplicateInfo[]>([]);
  const [hasLangFiles, setHasLangFiles] = useState<boolean>(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
    },
    shape: {
      borderRadius: 8,
    },
  });

  const handleSelectDirectory = async () => {
    try {
      const directory = await window.electron.selectDirectory();
      if (!directory) {
        return;
      }

      try {
        const hasFiles = await window.electron.checkDirectory(directory);
        setHasLangFiles(hasFiles);
        
        if (!hasFiles) {
          setError('В выбранной директории нет файлов локализации (lang_*.json)');
          return;
        }
      } catch (err) {
        setError('Ошибка при проверке директории');
        console.error('Error checking directory:', err);
        return;
      }

      setSelectedDirectory(directory);
      const updatedDirectories = [directory, ...recentDirectories.filter(d => d && d !== directory)]
        .slice(0, 5);
      setRecentDirectories(updatedDirectories);
      localStorage.setItem('recentDirectories', JSON.stringify(updatedDirectories));
      setError(null);
    } catch (err) {
      setError('Ошибка при выборе директории');
      console.error('Error selecting directory:', err);
    }
  };

  const handleSelectRecentDirectory = async (directory: string) => {
    try {
      const hasFiles = await window.electron.checkDirectory(directory);
      setHasLangFiles(hasFiles);
      
      if (!hasFiles) {
        setError('В выбранной директории нет файлов локализации (lang_*.json)');
      } else {
        setError(null);
      }
      
      setSelectedDirectory(directory);
    } catch (err) {
      setError('Ошибка при проверке директории');
      console.error('Error checking directory:', err);
    }
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    const keysWithDuplicates = text
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.includes('#');
      })
      .map(line => {
        const trimmed = line.trim();
        const matches = trimmed.match(/(#[^\s\t"]+)/g);
        const matchJson = trimmed.match(/"(#[^"]+)"/);
        
        if (matches) return matches[0];
        if (matchJson) return matchJson[1];
        return '';
      })
      .filter(key => key !== '');

    const keyCount = keysWithDuplicates.reduce((acc, key) => {
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicates = Object.entries(keyCount)
      .filter(([_, count]) => count > 1)
      .map(([key, count]) => ({ key, count }));

    setDuplicateKeys(duplicates);
    
    const uniqueKeys = [...new Set(keysWithDuplicates)];
    setExtractedKeys(uniqueKeys);
    setError(null);
  };

  const handleValidate = async () => {
    if (!selectedDirectory || extractedKeys.length === 0) {
      setError('Выберите директорию и введите ключи для валидации');
      return;
    }
    
    console.log('Starting validation with:', {
      directory: selectedDirectory,
      keys: extractedKeys,
    });
    
    setIsValidating(true);
    setError(null);
    
    try {
      const results = await window.electron.validateFiles(selectedDirectory, extractedKeys);
      console.log('Validation results:', results);
      setValidationResults(results);
    } catch (error: unknown) {
      console.error('Validation error:', error);
      
      if (error instanceof Error && error.message === 'NO_JSON_FILES') {
        setError('В выбранной директории нет файлов локализации (lang_*.json)');
      } else {
        setError('Ошибка при валидации файлов. Проверьте консоль для деталей.');
      }
      
      setValidationResults([]);
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const VISIBLE_KEYS_COUNT = 10;
  const hasMoreKeys = extractedKeys.length > VISIBLE_KEYS_COUNT;
  const visibleKeys = showAllKeys ? extractedKeys : extractedKeys.slice(0, VISIBLE_KEYS_COUNT);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StyledContainer maxWidth="lg">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Валидатор ключей
          </Typography>
          <IconButton onClick={() => setDarkMode(!darkMode)} color="inherit">
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>

        <StyledPaper elevation={3}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box display="flex" flexDirection="column" gap={2} sx={{ flex: 1 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button
                  variant="contained"
                  color={selectedDirectory ? "success" : "primary"}
                  startIcon={<FolderOpen />}
                  onClick={handleSelectDirectory}
                  size="large"
                  sx={{
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: selectedDirectory ? '#2e7d32' : '#1976d2',
                    }
                  }}
                >
                  Выбрать директорию
                </Button>
                <Typography variant="body1" color="textSecondary">
                  {selectedDirectory || 'Директория не выбрана'}
                </Typography>
              </Box>
              {recentDirectories.length > 0 && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                    Недавние папки:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {recentDirectories.map((dir, index) => (
                      <Chip
                        key={index}
                        label={dir ? dir.split('/').pop() || dir : ''}
                        title={dir}
                        onClick={() => handleSelectRecentDirectory(dir)}
                        variant={selectedDirectory === dir ? "filled" : "outlined"}
                        size="small"
                        icon={<FolderOpen fontSize="small" />}
                        sx={{ 
                          maxWidth: '200px',
                          backgroundColor: selectedDirectory === dir ? 'rgba(46, 125, 50, 0.1)' : 'transparent'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            label="Введите текст с ключами (#)"
            value={inputText}
            onChange={handleTextInput}
            sx={{ mb: 3 }}
          />

          {extractedKeys.length > 0 && (
            <Box mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6">
                  Найденные ключи ({extractedKeys.length}):
                </Typography>
                {duplicateKeys.length > 0 && (
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Найдены и удалены дубликаты:
                        </Typography>
                        {duplicateKeys.map(({ key, count }) => (
                          <Typography key={key} variant="body2" sx={{ ml: 1 }}>
                            • {key} (повторялся {count} раз{count > 4 ? '' : ['а', 'а', 'а', 'а'][count - 1]})
                          </Typography>
                        ))}
                      </Box>
                    }
                    arrow
                  >
                    <Chip
                      icon={<InfoOutlined />}
                      label={`Удалено дубликатов: ${duplicateKeys.reduce((sum, { count }) => sum + count - 1, 0)}`}
                      color="info"
                      size="small"
                      sx={{ cursor: 'help' }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {visibleKeys.map(key => (
                    <Chip
                      key={key}
                      label={key}
                      onDelete={() => copyToClipboard(key)}
                      deleteIcon={<ContentCopy />}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                {hasMoreKeys && (
                  <Button
                    onClick={() => setShowAllKeys(!showAllKeys)}
                    sx={{
                      mt: 1,
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(180deg, rgba(30,30,30,0) 0%, rgba(30,30,30,1) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(180deg, rgba(40,40,40,0) 0%, rgba(40,40,40,1) 100%)'
                          : 'linear-gradient(180deg, rgba(245,245,245,0) 0%, rgba(245,245,245,1) 100%)',
                      },
                      position: 'relative',
                      zIndex: 1,
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.secondary
                    }}
                    endIcon={showAllKeys ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  >
                    {showAllKeys 
                      ? 'Свернуть список' 
                      : `Показать еще ${extractedKeys.length - VISIBLE_KEYS_COUNT} ключей`
                    }
                  </Button>
                )}
              </Box>
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Tooltip 
              title={
                !selectedDirectory 
                  ? "Выберите директорию"
                  : !hasLangFiles 
                    ? "В выбранной директории нет файлов локализации"
                    : extractedKeys.length === 0 
                      ? "Введите ключи для валидации"
                      : ""
              }
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleValidate}
                  disabled={isValidating || !selectedDirectory || !hasLangFiles || extractedKeys.length === 0}
                  startIcon={isValidating ? <CircularProgress size={20} /> : <Check />}
                  size="large"
                >
                  {isValidating ? 'Валидация...' : 'Провалидировать'}
                </Button>
              </span>
            </Tooltip>
            
            {error && (
              <Alert severity="error" sx={{ ml: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </StyledPaper>

        {validationResults.length > 0 && (
          <>
            <Box mb={2}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setViewMode(newValue as ViewMode);
                  }
                }}
                aria-label="режим отображения"
                size="small"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  '.MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '8px !important',
                    px: 3,
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(144, 202, 249, 0.16)'
                        : 'rgba(33, 150, 243, 0.08)',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(144, 202, 249, 0.24)'
                          : 'rgba(33, 150, 243, 0.12)',
                      },
                    },
                  },
                }}
              >
                <ToggleButton 
                  value="byFile" 
                  aria-label="по файлам"
                  sx={{ gap: 1 }}
                >
                  <ViewList />
                  По файлам
                </ToggleButton>
                <ToggleButton 
                  value="byKey" 
                  aria-label="по ключам"
                  sx={{ gap: 1 }}
                >
                  <ViewModule />
                  По ключам
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {viewMode === 'byFile' ? (
              <ValidationResultsByFile 
                results={validationResults} 
                totalKeys={extractedKeys} 
              />
            ) : (
              <ValidationResultsByKey 
                results={validationResults}
                totalKeys={extractedKeys}
              />
            )}
          </>
        )}
      </StyledContainer>
    </ThemeProvider>
  );
};

// Обновляем интерфейс для пропсов
interface ValidationResultsProps {
  results: ValidationResult[];
  totalKeys: string[];
}

// Обновляем компонент ValidationResultsByFile
const ValidationResultsByFile: React.FC<ValidationResultsProps> = ({ results, totalKeys }) => {
  return (
    <StyledPaper>
      <Typography variant="h5" gutterBottom>
        Результаты валидации ({results.length} файлов)
      </Typography>
      <List>
        {results.map((result, index) => (
          <React.Fragment key={result.file}>
            <ListItem>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">{result.file}</Typography>
                    <Box display="flex" gap={1}>
                      {result.missingKeys.length === 0 && result.emptyTranslations.length === 0 ? (
                        <Chip
                          icon={<Check />}
                          label="Все ОК"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <>
                          <Chip
                            icon={<ErrorIcon />}
                            label={`Проблемных ключей: ${result.missingKeys.length + result.emptyTranslations.length}`}
                            color="error"
                            size="small"
                          />
                          <Chip
                            icon={<Check />}
                            label={`Корректных ключей: ${totalKeys.length - (result.missingKeys.length + result.emptyTranslations.length)}`}
                            color="success"
                            size="small"
                          />
                        </>
                      )}
                    </Box>
                  </Box>
                }
                secondary={
                  <Box mt={1}>
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Всего проверено ключей: {totalKeys.length}
                      </Typography>
                    </Box>
                    {(result.missingKeys.length > 0 || result.emptyTranslations.length > 0) && (
                      <>
                        {result.missingKeys.length > 0 && (
                          <Box mb={2}>
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                              <Typography variant="subtitle2" color="error">
                                Отсутствуют ключи ({result.missingKeys.length}):
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<ContentCopy />}
                                onClick={() => navigator.clipboard.writeText(result.missingKeys.join('\n'))}
                                sx={{ minHeight: '15px', textTransform: 'none' }}
                              >
                                Скопировать все ключи
                              </Button>
                            </Box>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {result.missingKeys.map(key => (
                                <Chip
                                  key={key}
                                  label={key}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onDelete={() => navigator.clipboard.writeText(key)}
                                  deleteIcon={<ContentCopy />}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        {result.emptyTranslations.length > 0 && (
                          <Box>
                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                              <Typography variant="subtitle2" color="warning.main">
                                Отсутствуют переводы ({result.emptyTranslations.length}):
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<ContentCopy />}
                                onClick={() => navigator.clipboard.writeText(result.emptyTranslations.join('\n'))}
                                sx={{ minHeight: '24px', textTransform: 'none' }}
                              >
                                Скопировать все ключи
                              </Button>
                            </Box>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                              {result.emptyTranslations.map(key => (
                                <Chip
                                  key={key}
                                  label={key}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  onDelete={() => navigator.clipboard.writeText(key)}
                                  deleteIcon={<ContentCopy />}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                }
              />
            </ListItem>
            {index < results.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </StyledPaper>
  );
};

// Обновляем компонент ValidationResultsByKey
const ValidationResultsByKey: React.FC<ValidationResultsProps> = ({ results, totalKeys }) => {
  const keysMissingInFiles: Record<string, string[]> = {};
  const keysWithEmptyTranslations: Record<string, string[]> = {};
  
  results.forEach(result => {
    // Собираем отсутствующие ключи
    result.missingKeys?.forEach(key => {
      if (!keysMissingInFiles[key]) {
        keysMissingInFiles[key] = [];
      }
      keysMissingInFiles[key].push(result.file);
    });

    // Собираем пустые переводы
    result.emptyTranslations?.forEach(key => {
      if (!keysWithEmptyTranslations[key]) {
        keysWithEmptyTranslations[key] = [];
      }
      keysWithEmptyTranslations[key].push(result.file);
    });
  });

  return (
    <StyledPaper>
      <Typography variant="h5" gutterBottom>
        Проблемные ключи ({Object.keys(keysMissingInFiles).length + Object.keys(keysWithEmptyTranslations).length})
      </Typography>

      {Object.keys(keysMissingInFiles).length > 0 && (
        <>
          <Typography variant="h6" color="error" gutterBottom sx={{ mt: 3 }}>
            Отсутствуют ключи ({Object.keys(keysMissingInFiles).length}):
          </Typography>
          <List>
            {Object.entries(keysMissingInFiles).map(([key, files]) => (
              <React.Fragment key={key}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                          <Typography variant="subtitle1" component="span">
                            {key}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => navigator.clipboard.writeText(key)}
                            sx={{ padding: '4px' }}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                        <Chip
                          icon={<ErrorIcon />}
                          label={`Отсутствует в ${files.length} файлах`}
                          color="error"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={2}>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          В файлах: ({files.length}):
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {files.map(file => (
                            <Chip
                              key={file}
                              label={file}
                              size="small"
                              color="error"
                              variant="outlined"
                              onDelete={() => navigator.clipboard.writeText(file)}
                              deleteIcon={<ContentCopy />}
                              sx={{ 
                                justifyContent: 'space-between',
                                width: 'fit-content'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {Object.keys(keysWithEmptyTranslations).length > 0 && (
        <>
          <Typography variant="h6" color="warning.main" gutterBottom sx={{ mt: 3 }}>
            Отсутствуют переводы ({Object.keys(keysWithEmptyTranslations).length}):
          </Typography>
          <List>
            {Object.entries(keysWithEmptyTranslations).map(([key, files]) => (
              <React.Fragment key={key}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={1} flex={1}>
                          <Typography variant="subtitle1" component="span">
                            {key}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => navigator.clipboard.writeText(key)}
                            sx={{ padding: '4px' }}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Box>
                        <Chip
                          icon={<ErrorIcon />}
                          label={`Отсутствует перевод в ${files.length} файлах`}
                          color="warning"
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={2}>
                        <Typography variant="subtitle2" color="warning.main" gutterBottom>
                          Файлы ({files.length}):
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {files.map(file => (
                            <Chip
                              key={file}
                              label={file}
                              size="small"
                              color="warning"
                              variant="outlined"
                              onDelete={() => navigator.clipboard.writeText(file)}
                              deleteIcon={<ContentCopy />}
                              sx={{ 
                                justifyContent: 'space-between',
                                width: 'fit-content'
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </StyledPaper>
  );
};

export default App; 