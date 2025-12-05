export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary?: string;
  publishedAt: number;
  lastEditedAt: number;
  isDraft: boolean;
}

export interface StorySettings {
  title: string;
  author: string;
  description: string;
  themeColor: string;
}

export enum AppView {
  READER = 'READER',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  EDITOR = 'EDITOR',
}