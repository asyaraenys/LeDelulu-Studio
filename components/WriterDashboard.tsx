import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Chapter, StorySettings, AppView } from '../types';
import { getChapters, saveChapter, deleteChapter, getSettings, saveSettings, setAuthenticated } from '../services/storageService';
import { Button } from './Button';

interface WriterDashboardProps {
  onChangeView: (view: AppView) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const WriterDashboard: React.FC<WriterDashboardProps> = ({ onChangeView, isDarkMode, onToggleTheme }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [settings, setSettings] = useState<StorySettings>(getSettings());
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  
  // Selection & Export State
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Ref for the contenteditable div
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setChapters(getChapters());
  }, []);

  // When opening a chapter, load content into the editorRef
  useEffect(() => {
    if (editingChapter && editorRef.current) {
        // Only update if innerHTML is empty to prevent overwriting during rapid state updates,
        // or if the ID has changed (switching chapters).
        // Since we are using an uncontrolled component pattern for the editor content,
        // we manually sync the initial state once.
        if (editorRef.current.innerHTML !== editingChapter.content) {
             editorRef.current.innerHTML = editingChapter.content;
        }
    }
  }, [editingChapter?.id]);

  // Auto-resize Title logic
  useLayoutEffect(() => {
    if (editingChapter && titleRef.current) {
      const titleArea = titleRef.current;
      // Reset to auto to allow shrink and proper calculation without clipping
      titleArea.style.height = 'auto';
      titleArea.style.height = titleArea.scrollHeight + 'px';
    }
  }, [editingChapter?.title]);

  const handleLogout = () => {
    setAuthenticated(false);
    onChangeView(AppView.READER);
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
    alert('Settings saved!');
  };

  const createNewChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: '',
      content: '', // Empty HTML
      publishedAt: Date.now(),
      lastEditedAt: Date.now(),
      isDraft: true,
    };
    setEditingChapter(newChapter);
    // Clear editor manually if it exists
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
  };

  const handleDeleteChapter = (id: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      deleteChapter(id);
      setChapters(getChapters());
      if (editingChapter?.id === id) setEditingChapter(null);
      
      // Remove from selection if deleted
      if (selectedChapterIds.has(id)) {
        const newSet = new Set(selectedChapterIds);
        newSet.delete(id);
        setSelectedChapterIds(newSet);
      }
    }
  };

  const handleSaveChapter = () => {
    if (!editingChapter) return;
    const toSave = { ...editingChapter, lastEditedAt: Date.now() };
    saveChapter(toSave);
    setChapters(getChapters());
    alert('Chapter saved!');
  };

  // --- SELECTION LOGIC ---

  const toggleSelectChapter = (id: string) => {
    const newSet = new Set(selectedChapterIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedChapterIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedChapterIds.size === chapters.length && chapters.length > 0) {
        setSelectedChapterIds(new Set());
    } else {
        const allIds = new Set(chapters.map(c => c.id));
        setSelectedChapterIds(allIds);
    }
  };

  // --- EXPORT LOGIC ---

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    let selected = chapters.filter(c => selectedChapterIds.has(c.id));
    
    // If no specific selection, export ALL chapters
    if (selected.length === 0 && chapters.length > 0) {
        selected = [...chapters];
    }

    if (selected.length === 0) return;

    // We sort selected chapters by published date to ensure correct reading order
    selected.sort((a, b) => a.publishedAt - b.publishedAt);

    const fullContent = selected.map(c => `
      <section class="chapter mb-24">
        <h2 class="text-4xl font-bold mb-10 text-stone-900 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-4">${c.title}</h2>
        <div class="rich-text font-serif text-lg leading-loose text-stone-800 dark:text-stone-300">
          ${c.content}
        </div>
        <div class="text-center mt-16 mb-8 text-stone-300 dark:text-stone-700 text-2xl tracking-widest user-select-none">🞛🞛🞛🞛🞛</div>
      </section>
    `).join('\n');

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${settings.title} - Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              serif: ['Merriweather', 'serif'],
            },
            colors: {
              paper: '#fdfbf7',
              ink: '#2d2a2e',
            }
          }
        }
      }
    </script>
    <style>
      body { 
        background-color: #fdfbf7; 
        color: #2d2a2e; 
        transition: background-color 0.3s ease, color 0.3s ease;
      }
      html.dark body { 
        background-color: #1c1917; 
        color: #e7e5e4; 
      }
      .rich-text blockquote {
        border-left: 4px solid #d6d3d1;
        padding-left: 1rem;
        margin: 1rem 0;
        font-style: italic;
        color: #57534e;
      }
      html.dark .rich-text blockquote {
        border-color: #44403c;
        color: #a8a29e;
      }
      .rich-text ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
      .rich-text ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
      .rich-text p { margin-bottom: 1rem; }
      
      /* Toggle Button Styles */
      .theme-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(0,0,0,0.05);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #57534e;
        transition: all 0.2s;
        backdrop-filter: blur(4px);
        z-index: 50;
      }
      html.dark .theme-toggle {
        background: rgba(255,255,255,0.1);
        color: #a8a29e;
      }
      .theme-toggle:hover {
        transform: scale(1.1);
        background: rgba(0,0,0,0.1);
      }
      html.dark .theme-toggle:hover {
        background: rgba(255,255,255,0.15);
      }
    </style>
    <script>
      // Initialize theme based on system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }

      function toggleTheme() {
        document.documentElement.classList.toggle('dark');
      }
    </script>
</head>
<body class="p-6 md:p-20 max-w-3xl mx-auto font-serif selection:bg-stone-200 dark:selection:bg-stone-700">
    <!-- Theme Toggle -->
    <button onclick="toggleTheme()" class="theme-toggle" title="Toggle Theme" aria-label="Toggle Dark Mode">
        <svg class="sun" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
    </button>

    <header class="mb-20 text-center font-sans">
        <h1 class="text-4xl font-bold mb-2 text-stone-900 dark:text-stone-100">${settings.title}</h1>
        <p class="text-stone-500 dark:text-stone-400">by ${settings.author}</p>
        <p class="text-sm text-stone-400 mt-4 italic">${settings.description}</p>
    </header>
    
    <main>
        ${fullContent}
    </main>
    
    <footer class="text-center text-xs text-stone-400 font-sans mt-20 pt-10 border-t border-stone-200 dark:border-stone-800">
        Generated by LeDelulu
    </footer>
</body>
</html>`;

    downloadFile(htmlTemplate, `${settings.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compilation.html`, 'text/html');
  };

  const handleExportTXT = () => {
    let selected = chapters.filter(c => selectedChapterIds.has(c.id));
    
    // If no specific selection, export ALL chapters
    if (selected.length === 0 && chapters.length > 0) {
        selected = [...chapters];
    }
    
    if (selected.length === 0) return;
    
    selected.sort((a, b) => a.publishedAt - b.publishedAt);

    // Simple HTML to Text converter
    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        // Pre-process common block tags to ensure spacing
        let processed = html
            .replace(/<\/p>/g, '\n\n')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<\/div>/g, '\n')
            .replace(/<\/li>/g, '\n');
        tmp.innerHTML = processed;
        return tmp.textContent || tmp.innerText || "";
    };

    let txtContent = `${settings.title}\nby ${settings.author}\n\n${settings.description}\n\n`;
    txtContent += "==================================================\n\n";

    selected.forEach(c => {
        txtContent += `Chapter: ${c.title}\n`;
        txtContent += `--------------------------------------------------\n\n`;
        txtContent += stripHtml(c.content).trim();
        txtContent += "\n\n🞛🞛🞛🞛🞛\n\n";
    });

    downloadFile(txtContent, `${settings.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_compilation.txt`, 'text/plain');
  };

  // --- RICH TEXT ---
  
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
        setEditingChapter(prev => prev ? ({ ...prev, content: editorRef.current?.innerHTML || '' }) : null);
    }
  };

  const handleBodyContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' ||
        target.tagName === 'LABEL' || 
        target.closest('button') ||
        target.closest('[contenteditable="true"]')
    ) {
        return;
    }
    if (editorRef.current) {
        editorRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }
  };

  const handleHeaderZoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (titleRef.current) {
        titleRef.current.focus();
        if (e.target !== titleRef.current) {
             const len = titleRef.current.value.length;
             titleRef.current.setSelectionRange(len, len);
        }
    }
  };

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editingChapter) {
        setEditingChapter({ ...editingChapter, content: e.currentTarget.innerHTML });
    }
  };
  
  // Track formatting state for UI feedback
  const [formats, setFormats] = useState({
      bold: false,
      italic: false,
      underline: false,
  });

  useEffect(() => {
    const handleSelectionChange = () => {
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // --- RENDER ---

  if (editingChapter) {
    // EDITOR VIEW (Same as before)
    return (
      <div className="min-h-screen bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300">
        <header className="border-b border-stone-200 dark:border-stone-800 px-6 py-4 flex items-center justify-between bg-stone-50 dark:bg-stone-950 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setEditingChapter(null)} className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-200">
              ← Back
            </button>
            <span className="text-stone-400">|</span>
            <h2 className="font-bold text-lg hidden sm:block truncate max-w-xs">{editingChapter.title || 'Untitled Chapter'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-4 text-xs text-stone-400 hidden sm:block">
                {editingChapter.isDraft ? 'Draft' : 'Published'}
            </div>
            <Button variant="ghost" onClick={handleSaveChapter}>Save</Button>
            <Button variant="primary" onClick={() => {
                const updated = { ...editingChapter, isDraft: !editingChapter.isDraft };
                setEditingChapter(updated);
                saveChapter(updated); 
                setChapters(getChapters());
            }}>
              {editingChapter.isDraft ? 'Publish' : 'Unpublish'}
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden shadow-sm bg-white dark:bg-stone-900 relative">
          
          <div className="px-8 py-2 border-b border-stone-100 dark:border-stone-800 flex gap-2 overflow-x-auto bg-white dark:bg-stone-900 shrink-0 sticky top-0 z-10 items-center">
            <button title="Undo" onClick={() => execCmd('undo')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 dark:text-stone-400 w-8 h-8 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button title="Redo" onClick={() => execCmd('redo')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 dark:text-stone-400 w-8 h-8 flex items-center justify-center mr-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
            </button>
            <div className="w-px bg-stone-200 dark:bg-stone-700 h-6"></div>
            
            <button 
                title="Bold" 
                onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} 
                className={`p-2 rounded font-bold font-serif w-8 h-8 flex items-center justify-center transition-colors
                    ${formats.bold 
                        ? 'bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-900' 
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
            >B</button>
            
            <button 
                title="Italic" 
                onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} 
                className={`p-2 rounded italic font-serif w-8 h-8 flex items-center justify-center transition-colors
                    ${formats.italic
                        ? 'bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-900' 
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
            >I</button>
            
            <button 
                title="Underline" 
                onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} 
                className={`p-2 rounded underline font-serif w-8 h-8 flex items-center justify-center transition-colors
                    ${formats.underline
                        ? 'bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-900' 
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
            >U</button>
            
            <div className="w-px bg-stone-200 dark:bg-stone-700 mx-1 h-6"></div>
            <button title="Scene Break" onMouseDown={(e) => { e.preventDefault(); execCmd('insertHorizontalRule'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 dark:text-stone-500 w-8 h-8 flex items-center justify-center">
               <span className="border-b-2 border-current w-full h-px opacity-50"></span>
            </button>
            <button title="Bullet List" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 w-8 h-8 flex items-center justify-center text-xl leading-none">•</button>
            <button title="Quote" onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 font-mono w-8 h-8 flex items-center justify-center font-bold text-lg">{'>'}</button>
          </div>

          <div className="flex-1 overflow-y-auto w-full cursor-text" onClick={handleBodyContainerClick}>
             <div className="w-full px-8 py-12 cursor-text group border-b border-transparent transition-colors" onClick={handleHeaderZoneClick}>
                <textarea
                  ref={titleRef}
                  placeholder="Chapter Title"
                  rows={1}
                  className="block w-full min-h-[80px] box-border text-4xl font-serif font-bold bg-transparent resize-none overflow-hidden leading-normal border border-transparent focus:border-transparent outline-none focus:outline-none ring-0 focus:ring-0 shadow-none focus:shadow-none py-3 px-0 placeholder-stone-300 dark:placeholder-stone-700 text-stone-900 dark:text-stone-100 caret-stone-900 dark:caret-stone-100"
                  value={editingChapter.title}
                  onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        editorRef.current?.focus();
                    }
                  }}
                />
             </div>
            
            <div className="px-8 pb-32">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentInput}
                    data-placeholder="Start writing your story..."
                    className="rich-text w-full min-h-[90vh] font-serif text-lg leading-relaxed outline-none border-none text-stone-800 dark:text-stone-300 caret-stone-900 dark:caret-stone-100 empty:before:content-[attr(data-placeholder)] empty:before:text-stone-300 dark:empty:before:text-stone-700"
                />
                
                <div className="mt-12 pt-8 border-t border-stone-100 dark:border-stone-800">
                <label className="block text-sm font-medium text-stone-500 mb-2 cursor-default">Summary (Teaser)</label>
                <textarea
                    rows={3}
                    className="w-full p-3 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500 outline-none transition-all dark:text-stone-200 caret-stone-900 dark:caret-stone-100"
                    value={editingChapter.summary || ''}
                    onChange={(e) => setEditingChapter({ ...editingChapter, summary: e.target.value })}
                    placeholder="A short teaser for the chapter index..."
                />
                </div>
                 <div className="h-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD LIST VIEW
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <nav className="bg-stone-900 dark:bg-black text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-xl tracking-tight">LeDelulu <span className="text-stone-500 font-normal">Dashboard</span></h1>
        <div className="flex gap-4 items-center">
          <button onClick={onToggleTheme} className="text-stone-400 hover:text-white transition-colors p-1" title="Toggle Theme">
                {isDarkMode ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
          </button>
          <span className="text-stone-700">|</span>
          <button onClick={() => onChangeView(AppView.READER)} className="text-stone-400 hover:text-white transition-colors text-sm">
            View Live Site
          </button>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-10 px-6">
        <section className="bg-white dark:bg-stone-900 rounded-lg p-6 shadow-sm mb-8 border border-stone-200 dark:border-stone-800">
          <h2 className="font-bold text-lg mb-4 text-stone-800 dark:text-stone-100 border-b border-stone-100 dark:border-stone-800 pb-2">Story Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Title</label>
                <input value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded px-3 py-2 focus:ring-2 focus:ring-stone-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Author Name</label>
                <input value={settings.author} onChange={(e) => setSettings({ ...settings, author: e.target.value })} className="w-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded px-3 py-2 focus:ring-2 focus:ring-stone-500 focus:outline-none" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                 <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Description</label>
                 <textarea value={settings.description} onChange={(e) => setSettings({ ...settings, description: e.target.value })} className="w-full h-24 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded px-3 py-2 focus:ring-2 focus:ring-stone-500 focus:outline-none resize-none" />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} variant="secondary">Update Settings</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-stone-900 rounded-lg shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        checked={chapters.length > 0 && selectedChapterIds.size === chapters.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-stone-800 border-stone-300 rounded focus:ring-stone-500 bg-white dark:bg-stone-800 dark:border-stone-600 accent-stone-800"
                    />
                    <h2 className="font-bold text-lg text-stone-800 dark:text-stone-100">Chapters</h2>
                </div>
            </div>
            
            <div className="flex gap-2 relative">
                <div className="relative">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowExportMenu(!showExportMenu)} 
                        className="flex items-center gap-2"
                        disabled={chapters.length === 0}
                    >
                        {selectedChapterIds.size > 0 ? `Export (${selectedChapterIds.size})` : 'Export All'}
                        <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </Button>
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-800 rounded-md shadow-lg border border-stone-200 dark:border-stone-700 z-50 overflow-hidden animate-fade-in">
                            <button onClick={handleExportHTML} className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700">
                                Web / eBook (.html)
                            </button>
                            <button onClick={handleExportTXT} className="w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 border-t border-stone-100 dark:border-stone-700">
                                Plain Text (.txt)
                            </button>
                        </div>
                    )}
                     {/* Click outside to close export menu */}
                    {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>}
                </div>
                <Button onClick={createNewChapter}>+ New Chapter</Button>
            </div>
          </div>
          
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {chapters.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                You haven't written any chapters yet.
              </div>
            ) : (
              chapters.map(chapter => (
                <div key={chapter.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                     <input 
                        type="checkbox" 
                        checked={selectedChapterIds.has(chapter.id)}
                        onChange={() => toggleSelectChapter(chapter.id)}
                        className="w-4 h-4 text-stone-800 border-stone-300 rounded focus:ring-stone-500 bg-white dark:bg-stone-800 dark:border-stone-600 accent-stone-800 shrink-0"
                    />
                    <div className="min-w-0">
                        <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate">{chapter.title || 'Untitled'}</h3>
                        <p className="text-xs text-stone-400 mt-1">
                        {chapter.isDraft ? 'Draft' : 'Published'} • Last edited {new Date(chapter.lastEditedAt).toLocaleDateString()}
                        </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" className="text-xs py-1 px-3 h-8" onClick={() => handleEditChapter(chapter)}>Edit</Button>
                    <button 
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};