import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Activity, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();

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
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cyber-cyan" strokeWidth={1.5} />
            <span className="text-2xl font-mono font-bold tracking-tighter">SecureVision AI</span>
          </div>
          <div className="space-x-4">
            <Button
              data-testid="nav-login-btn"
              variant="ghost"
              className="font-mono uppercase text-cyber-cyan hover:bg-cyber-cyan/10"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              data-testid="nav-register-btn"
              className="font-mono uppercase bg-cyber-cyan text-black hover:bg-cyber-cyan/80"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-32 mb-20 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tighter leading-none mb-8">
            <span className="text-cyber-cyan">AI-Powered</span>
            <br />
            Cyber Threat Detection
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 font-sans">
            Advanced threat intelligence powered by GPT-5.2. Analyze URLs, IP addresses, and files in real-time with enterprise-grade security.
          </p>
          <Button
            data-testid="hero-cta-btn"
            size="lg"
            className="font-mono uppercase text-lg px-8 py-6 bg-cyber-cyan text-black hover:bg-cyber-cyan/80 neon-glow"
            onClick={() => navigate('/register')}
          >
            Start Scanning
          </Button>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 pb-20">
          {[
            {
              icon: <Shield className="w-8 h-8" strokeWidth={1.5} />,
              title: 'URL Threat Analysis',
              description: 'Real-time URL scanning with AI-powered risk scoring and detailed threat explanations',
              color: 'cyan'
            },
            {
              icon: <Activity className="w-8 h-8" strokeWidth={1.5} />,
              title: 'IP Reputation Check',
              description: 'Comprehensive IP analysis with geolocation tracking and abuse score detection',
              color: 'purple'
            },
            {
              icon: <Lock className="w-8 h-8" strokeWidth={1.5} />,
              title: 'File Scanner',
              description: 'Advanced malware detection using SHA-256 hashing and AI classification',
              color: 'green'
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * idx, duration: 0.6 }}
              data-testid={`feature-card-${idx}`}
              className={`p-8 bg-cyber-gray/50 backdrop-blur-md border border-white/10 hover:border-cyber-${feature.color}/50 transition-all duration-300`}
            >
              <div className={`text-cyber-${feature.color} mb-4`}>{feature.icon}</div>
              <h3 className="text-xl font-mono font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 font-sans">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;