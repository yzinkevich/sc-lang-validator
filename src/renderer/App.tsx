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
  useTheme
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
  KeyboardArrowDown
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

  const handleSelectRecentDirectory = (directory: string) => {
    setSelectedDirectory(directory);
    setError(null);
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    const keys = text
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
    
    setExtractedKeys(keys);
    setError(null);
  };

  const handleValidate = async () => {
    if (!selectedDirectory || extractedKeys.length === 0) {
      setError('Выберите директорию и введите ключи для валидации');
      return;
    }
    
    setIsValidating(true);
    setError(null);
    
    try {
      const results = await window.electron.validateFiles(selectedDirectory, extractedKeys);
      setValidationResults(results);
    } catch (error) {
      setError('Ошибка при валидации файлов');
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
            label="Введите текст с ключами (начинающимися с #)"
            value={inputText}
            onChange={handleTextInput}
            sx={{ mb: 3 }}
          />

          {extractedKeys.length > 0 && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Найденные ключи ({extractedKeys.length}):
              </Typography>
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
            <Button
              variant="contained"
              color="primary"
              onClick={handleValidate}
              disabled={isValidating || !selectedDirectory || extractedKeys.length === 0}
              startIcon={isValidating ? <CircularProgress size={20} /> : <Check />}
              size="large"
            >
              {isValidating ? 'Валидация...' : 'Провалидировать'}
            </Button>
            
            {error && (
              <Alert severity="error" sx={{ ml: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </StyledPaper>

        {validationResults.length > 0 && (
          <StyledPaper>
            <Typography variant="h5" gutterBottom>
              Результаты валидации ({validationResults.length} файлов)
            </Typography>
            <List>
              {validationResults.map((result, index) => (
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
                              label="Все ключи ОК"
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
                              label={`Корректных ключей: ${extractedKeys.length - (result.missingKeys.length + result.emptyTranslations.length)}`}
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
                              Всего проверено ключей: {extractedKeys.length}
                            </Typography>
                          </Box>
                          {result.missingKeys.length > 0 && (
                            <Box mb={1}>
                              <Typography color="error" variant="subtitle2">
                                Отсутствующие ключи ({result.missingKeys.length}):
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {result.missingKeys.map(key => (
                                  <Chip
                                    key={key}
                                    label={key}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onDelete={() => copyToClipboard(key)}
                                    deleteIcon={<ContentCopy />}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                          {result.emptyTranslations.length > 0 && (
                            <Box>
                              <Typography color="warning.main" variant="subtitle2">
                                Пустые переводы ({result.emptyTranslations.length}):
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {result.emptyTranslations.map(key => (
                                  <Chip
                                    key={key}
                                    label={key}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    onDelete={() => copyToClipboard(key)}
                                    deleteIcon={<ContentCopy />}
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                          {result.missingKeys.length === 0 && result.emptyTranslations.length === 0 && (
                            <Box>
                              <Typography color="success.main" variant="subtitle2">
                                Все указанные ключи ({extractedKeys.length}) присутствуют в конфиге и имеют переводы
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {(result.missingKeys.length > 0 || result.emptyTranslations.length > 0) && (
                    <Box px={2} py={1} bgcolor={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}>
                      <Typography variant="caption" color="textSecondary">
                        Нажмите на иконку копирования, чтобы скопировать ключ
                      </Typography>
                    </Box>
                  )}
                  {index < validationResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        )}
      </StyledContainer>
    </ThemeProvider>
  );
};

export default App; 