import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const currentLanguage = i18n.language;

  useEffect(() => {
    // Set document direction based on language
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    
    // Update body direction attribute for CSS
    document.body.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
  }, [currentLanguage]);

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    
    // Save to backend if user is logged in
    if (user) {
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
        await axios.put(`${API_URL}/user/language`, {
          preferred_language: lng
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to update language preference:', error);
        }
      }
    }
  };

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse" data-testid="language-switcher">
      <Globe className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
      <div className="flex items-center border border-white/20 overflow-hidden">
        <button
          onClick={() => changeLanguage('en')}
          data-testid="lang-en-btn"
          className={`px-3 py-1 text-xs font-mono uppercase transition-colors ${
            currentLanguage === 'en'
              ? 'bg-cyber-cyan text-black font-bold'
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={() => changeLanguage('ar')}
          data-testid="lang-ar-btn"
          className={`px-3 py-1 text-xs font-mono uppercase transition-colors ${
            currentLanguage === 'ar'
              ? 'bg-cyber-cyan text-black font-bold'
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          AR
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
