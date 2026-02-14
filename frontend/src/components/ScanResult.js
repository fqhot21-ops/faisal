import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const ScanResult = ({ result }) => {
  const getRiskColor = (level) => {
    if (level === 'Safe') return 'text-cyber-green';
    if (level === 'Suspicious') return 'text-cyber-yellow';
    return 'text-cyber-red';
  };

  const getRiskBg = (level) => {
    if (level === 'Safe') return 'bg-cyber-green/10 border-cyber-green';
    if (level === 'Suspicious') return 'bg-cyber-yellow/10 border-cyber-yellow';
    return 'bg-cyber-red/10 border-cyber-red';
  };

  const getRiskIcon = (level) => {
    if (level === 'Safe') return <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />;
    if (level === 'Suspicious') return <AlertTriangle className="w-12 h-12" strokeWidth={1.5} />;
    return <AlertCircle className="w-12 h-12" strokeWidth={1.5} />;
  };

  return (
    <div className="space-y-6" data-testid="scan-result">
      {/* Risk Level Card */}
      <div className={`bg-cyber-gray/50 backdrop-blur-md border-2 p-8 text-center ${getRiskBg(result.risk_level)}`}>
        <div className={`${getRiskColor(result.risk_level)} mb-4 flex justify-center`}>
          {getRiskIcon(result.risk_level)}
        </div>
        <h2 className={`text-3xl font-mono font-bold mb-2 ${getRiskColor(result.risk_level)}`} data-testid="risk-level">
          {result.risk_level}
        </h2>
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400">Risk Score</p>
            <p className={`text-2xl font-mono font-bold ${getRiskColor(result.risk_level)}`} data-testid="risk-score">
              {result.risk_score.toFixed(1)}%
            </p>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400">Confidence</p>
            <p className="text-2xl font-mono font-bold">{(result.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Target Info */}
      <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6">
        <h3 className="text-lg font-mono font-bold mb-4">Target Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm font-mono uppercase text-gray-400">Target</span>
            <span className="font-mono break-all text-right ml-4">{result.target}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm font-mono uppercase text-gray-400">Scan Type</span>
            <span className="font-mono uppercase">{result.scan_type}</span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6">
        <h3 className="text-lg font-mono font-bold mb-4">Analysis</h3>
        <p className="text-gray-300 font-sans leading-relaxed" data-testid="explanation">{result.explanation}</p>
      </div>

      {/* Details */}
      {result.details && Object.keys(result.details).length > 0 && (
        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-mono font-bold mb-4">Additional Details</h3>
          <div className="space-y-2">
            {Object.entries(result.details).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm font-mono uppercase text-gray-400">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-right ml-4">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanResult;