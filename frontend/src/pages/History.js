import React, { useEffect, useState } from 'react';
import { getScanHistory } from '../services/api';
import { Clock, Link2, Globe, FileUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { format } from 'date-fns';

const History = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getScanHistory();
      setScans(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getScanIcon = (type) => {
    if (type === 'url') return <Link2 className="w-4 h-4" strokeWidth={1.5} />;
    if (type === 'ip') return <Globe className="w-4 h-4" strokeWidth={1.5} />;
    return <FileUp className="w-4 h-4" strokeWidth={1.5} />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-cyber-cyan font-mono">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6" data-testid="scan-history-page">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">Scan History</h1>
          <p className="text-gray-400 font-sans">View all your previous scans</p>
        </div>

        <div className="space-y-3">
          {scans.length === 0 ? (
            <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-12 text-center">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-gray-400 font-mono">No scans yet</p>
            </div>
          ) : (
            scans.map((scan) => (
              <div
                key={scan.id}
                data-testid={`scan-history-item-${scan.id}`}
                className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6 hover:border-cyber-cyan/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-gray-400">{getScanIcon(scan.scan_type)}</div>
                      <span className="text-xs font-mono uppercase text-gray-500">{scan.scan_type}</span>
                      <span className="text-xs text-gray-600 font-mono">
                        {format(new Date(scan.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="font-mono text-lg mb-2 break-all">{scan.target}</p>
                    <p className="text-sm text-gray-400 font-sans">{scan.explanation}</p>
                  </div>
                  <div className="ml-6">
                    <div className={`px-4 py-2 border font-mono text-sm uppercase ${getRiskBg(scan.risk_level)} ${getRiskColor(scan.risk_level)}`}>
                      {scan.risk_level}
                    </div>
                    <p className="text-center mt-2 text-xs text-gray-500 font-mono">
                      {scan.risk_score.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default History;