import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Activity } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Extract animation configs as constants
const HERO_ANIMATION = { opacity: 0, y: 20 };
const HERO_ANIMATE = { opacity: 1, y: 0 };
const HERO_TRANSITION = { duration: 0.8 };

const getFeatureAnimation = (delay) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.2 * delay, duration: 0.6 }
});

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Memoize feature data
  const features = useMemo(() => [
    {
      icon: <Shield className="w-8 h-8" strokeWidth={1.5} />,
      title: t('landing.features.urlAnalysis.title'),
      description: t('landing.features.urlAnalysis.description'),
      color: 'cyan'
    },
    {
      icon: <Activity className="w-8 h-8" strokeWidth={1.5} />,
      title: t('landing.features.ipCheck.title'),
      description: t('landing.features.ipCheck.description'),
      color: 'purple'
    },
    {
      icon: <Lock className="w-8 h-8" strokeWidth={1.5} />,
      title: t('landing.features.fileScanner.title'),
      description: t('landing.features.fileScanner.description'),
      color: 'green'
    }
  ], [t]);

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:4rem_4rem] opacity-20" />
      
      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="scan-line absolute w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-20" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4">
        <nav className="flex items-center justify-between py-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <Shield className="w-8 h-8 text-cyber-cyan" strokeWidth={1.5} />
            <span className="text-2xl font-mono font-bold tracking-tighter">{t('common.appName')}</span>
          </div>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <LanguageSwitcher />
            <Button
              data-testid="nav-login-btn"
              variant="ghost"
              className="font-mono uppercase text-cyber-cyan hover:bg-cyber-cyan/10"
              onClick={() => navigate('/login')}
            >
              {t('nav.login')}
            </Button>
            <Button
              data-testid="nav-register-btn"
              className="font-mono uppercase bg-cyber-cyan text-black hover:bg-cyber-cyan/80"
              onClick={() => navigate('/register')}
            >
              {t('nav.getStarted')}
            </Button>
          </div>
        </nav>

        <motion.div
          initial={HERO_ANIMATION}
          animate={HERO_ANIMATE}
          transition={HERO_TRANSITION}
          className="mt-32 mb-20 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tighter leading-none mb-8">
            <span className="text-cyber-cyan">{t('landing.hero.title')}</span>
            <br />
            {t('landing.hero.subtitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-sans">
            {t('landing.hero.description')}
          </p>
          <Button
            data-testid="hero-cta-btn"
            size="lg"
            className="font-mono uppercase text-lg px-8 py-6 bg-cyber-cyan text-black hover:bg-cyber-cyan/80 neon-glow"
            onClick={() => navigate('/register')}
          >
            {t('landing.hero.cta')}
          </Button>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 pb-20">
          {features.map((feature, idx) => {
            const animationProps = getFeatureAnimation(idx);
            return (
              <motion.div
                key={`feature-${feature.color}`}
                initial={animationProps.initial}
                animate={animationProps.animate}
                transition={animationProps.transition}
                data-testid={`feature-card-${idx}`}
                className={`p-8 bg-cyber-gray/50 backdrop-blur-md border border-white/10 hover:border-cyber-${feature.color}/50 transition-all duration-300`}
              >
                <div className={`text-cyber-${feature.color} mb-4`}>{feature.icon}</div>
                <h3 className="text-xl font-mono font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 font-sans">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Landing;