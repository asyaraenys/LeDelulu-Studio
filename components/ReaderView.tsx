import React, { useState, useEffect } from 'react';
import { Chapter, StorySettings } from '../types';
import { getChapters, getSettings } from '../services/storageService';

interface ReaderViewProps {
  onLoginRequest: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

// Render HTML content directly from the WYSIWYG editor
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  return (
    <div 
        className="rich-text font-serif leading-loose text-lg md:text-xl text-stone-800 dark:text-stone-300 [&>p]:mb-4"
        dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const ReaderView: React.FC<ReaderViewProps> = ({ onLoginRequest, isDarkMode, onToggleTheme }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [settings, setSettings] = useState<StorySettings | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadedChapters = getChapters().filter(c => !c.isDraft);
    setChapters(loadedChapters);
    setSettings(getSettings());
    if (loadedChapters.length > 0) {
      setActiveChapterId(loadedChapters[0].id);
    }
  }, []);

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  // Scroll to top when chapter changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSidebarOpen(false);
  }, [activeChapterId]);

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-paper dark:bg-stone-950 text-ink dark:text-stone-300 font-serif selection:bg-stone-200 dark:selection:bg-stone-700 transition-colors duration-300">
      {/* Mobile Header */}
      <nav className="sticky top-0 z-40 bg-paper/95 dark:bg-stone-950/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
            <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md -ml-2"
            >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            </button>
            <h1 className="font-sans font-bold text-lg truncate text-stone-900 dark:text-stone-100">{settings.title}</h1>
        </div>
        
        <button 
          onClick={onToggleTheme}
          className="p-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-md"
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </nav>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-72 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h1 className="font-sans text-2xl font-bold text-stone-900 dark:text-stone-50 leading-tight">{settings.title}</h1>
              <p className="font-sans text-stone-500 dark:text-stone-400 text-sm">by {settings.author}</p>
            </div>
            
            <p className="font-serif text-sm text-stone-600 dark:text-stone-400 italic leading-relaxed border-l-2 border-stone-300 dark:border-stone-700 pl-3">
              {settings.description}
            </p>

            <nav className="space-y-1">
              <h3 className="font-sans text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Chapters</h3>
              {chapters.length === 0 ? (
                <p className="text-sm text-stone-400">No chapters published yet.</p>
              ) : (
                chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setActiveChapterId(chapter.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors font-sans
                      ${activeChapterId === chapter.id 
                        ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium' 
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                  >
                    <span className="opacity-50 mr-2">{index + 1}.</span>
                    {chapter.title}
                  </button>
                ))
              )}
            </nav>
          </div>
          
          <div className="p-8 mt-auto border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
            <button 
              onClick={onLoginRequest}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-sans flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Author Login
            </button>

            <button 
                onClick={onToggleTheme}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                title="Toggle Theme"
            >
                {isDarkMode ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/50 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {activeChapter ? (
            <article className="max-w-2xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
              <header className="mb-10 text-center space-y-4">
                <span className="font-sans text-xs font-medium tracking-widest text-stone-400 uppercase">
                  Chapter {chapters.findIndex(c => c.id === activeChapterId) + 1}
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  {activeChapter.title}
                </h2>
                {activeChapter.summary && (
                  <p className="text-stone-500 dark:text-stone-400 italic max-w-lg mx-auto leading-relaxed">
                    {activeChapter.summary}
                  </p>
                )}
                <div className="w-16 h-1 bg-stone-200 dark:bg-stone-800 mx-auto rounded-full mt-6"></div>
              </header>

              <div className="mx-auto">
                 <FormattedContent content={activeChapter.content} />
              </div>

              <div className="mt-20 pt-10 border-t border-stone-200 dark:border-stone-800 flex justify-between font-sans">
                {(() => {
                  const idx = chapters.findIndex(c => c.id === activeChapterId);
                  const prev = chapters[idx - 1];
                  const next = chapters[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button 
                          onClick={() => setActiveChapterId(prev.id)}
                          className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-2"
                        >
                          ← Previous
                        </button>
                      ) : <div />}
                      
                      {next ? (
                        <button 
                          onClick={() => setActiveChapterId(next.id)}
                          className="text-stone-900 dark:text-stone-100 font-medium hover:text-indigo-700 dark:hover:text-indigo-400 flex items-center gap-2"
                        >
                          Next Chapter →
                        </button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center h-screen text-stone-400 dark:text-stone-600 font-sans">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>Select a chapter to begin reading</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};