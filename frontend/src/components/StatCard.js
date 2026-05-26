import React from 'react';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const StatCard = ({ title, value, icon: Icon, color, delay = 0, testId }) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'border-cyber-green/30';
      case 'yellow':
        return 'border-cyber-yellow/30';
      case 'red':
        return 'border-cyber-red/30';
      default:
        return 'border-white/10';
    }
  };

  const getTextColor = () => {
    switch (color) {
      case 'green':
        return 'text-cyber-green';
      case 'yellow':
        return 'text-cyber-yellow';
      case 'red':
        return 'text-cyber-red';
      default:
        return '';
    }
  };

  return (
    <motion.div
      {...CARD_ANIMATION}
      transition={{ delay }}
      data-testid={testId}
      className={`bg-cyber-gray/50 backdrop-blur-md border ${getColorClasses()} p-6`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">{title}</p>
          <p className={`text-3xl font-mono font-bold ${getTextColor()}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${getTextColor() || 'text-cyber-cyan'}`} strokeWidth={1.5} />
      </div>
    </motion.div>
  );
};

export default StatCard;
