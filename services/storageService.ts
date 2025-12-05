import { Chapter, StorySettings } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export const getChapters = (): Chapter[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
  return data ? JSON.parse(data) : [];
};

export const saveChapter = (chapter: Chapter): void => {
  const chapters = getChapters();
  const existingIndex = chapters.findIndex((c) => c.id === chapter.id);
  
  if (existingIndex >= 0) {
    chapters[existingIndex] = chapter;
  } else {
    chapters.push(chapter);
  }
  
  // Sort by published date
  chapters.sort((a, b) => a.publishedAt - b.publishedAt);
  
  localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
};

export const deleteChapter = (id: string): void => {
  const chapters = getChapters();
  const filtered = chapters.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(filtered));
};

export const getSettings = (): StorySettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: StorySettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
};

export const setAuthenticated = (status: boolean): void => {
  if (status) {
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
};

export const getTheme = (): 'light' | 'dark' => {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
};