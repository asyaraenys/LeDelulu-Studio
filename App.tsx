import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import { ReaderView } from './components/ReaderView';
import { WriterDashboard } from './components/WriterDashboard';
import { isAuthenticated, setAuthenticated, getTheme, saveTheme } from './services/storageService';
import { MOCK_PASSWORD } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.READER);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if user was previously authenticated in this session
    if (isAuthenticated()) {
      // We don't auto-switch to dashboard, but we allow access if they click login
    }
    
    // Load theme
    const savedTheme = getTheme();
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === MOCK_PASSWORD) {
      setAuthenticated(true);
      setCurrentView(AppView.DASHBOARD);
      setPasswordInput('');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const renderContent = () => {
    const isDark = theme === 'dark';

    switch (currentView) {
      case AppView.READER:
        return (
            <ReaderView 
                onLoginRequest={() => setCurrentView(AppView.LOGIN)} 
                isDarkMode={isDark}
                onToggleTheme={toggleTheme}
            />
        );
      
      case AppView.DASHBOARD:
      case AppView.EDITOR:
        // Simple auth guard
        if (!isAuthenticated()) {
          setCurrentView(AppView.LOGIN);
          return null;
        }
        return (
            <WriterDashboard 
                onChangeView={setCurrentView} 
                isDarkMode={isDark}
                onToggleTheme={toggleTheme}
            />
        );
        
      case AppView.LOGIN:
        return (
          <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col justify-center items-center p-4 transition-colors duration-300">
            <div className="bg-white dark:bg-stone-900 p-8 rounded-lg shadow-xl border border-stone-200 dark:border-stone-800 w-full max-w-sm">
              <div className="text-center mb-6">
                <h2 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">Author Access</h2>
                <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">Enter the password to edit stories.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full border border-stone-300 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 focus:outline-none transition-all"
                    placeholder="Password"
                    autoFocus
                  />
                  {authError && <p className="text-red-500 text-xs mt-1">Incorrect password.</p>}
                  <p className="text-stone-400 text-xs mt-2 italic">Hint: The password is "admin"</p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-stone-800 dark:bg-stone-700 text-white py-2 rounded font-medium hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                  Enter Dashboard
                </button>
              </form>
              <button 
                onClick={() => setCurrentView(AppView.READER)}
                className="w-full mt-4 text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 text-sm"
              >
                ← Back to Reader
              </button>
            </div>
            {/* Login screen theme toggle just in case */}
            <div className="mt-8">
                 <button 
                  onClick={toggleTheme}
                  className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                >
                  {isDark ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
            </div>
          </div>
        );
        
      default:
        return <ReaderView onLoginRequest={() => setCurrentView(AppView.LOGIN)} isDarkMode={isDark} onToggleTheme={toggleTheme} />;
    }
  };

  return (
    <div className="antialiased">
       {renderContent()}
    </div>
  );
};

export default App;