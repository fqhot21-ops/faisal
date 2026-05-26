import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';

const ScanResult = ({ result }) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

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

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await axios.get(
        `${API_URL}/scan/${result.id}/pdf?language=${i18n.language}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SecureVision_Report_${result.id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({ title: t('common.success'), description: 'PDF downloaded successfully' });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF download error:', error);
      }
      toast({ 
        title: t('common.error'), 
        description: 'Failed to download PDF',
        variant: 'destructive'
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="scan-result">
      {/* Download PDF Button */}
      <div className="flex justify-end">
        <Button
          onClick={downloadPDF}
          disabled={downloading}
          data-testid="download-pdf-btn"
          className="font-mono uppercase bg-cyber-purple text-white hover:bg-cyber-purple/80"
        >
          <Download className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" strokeWidth={1.5} />
          {downloading ? t('common.loading') : t('common.downloadPDF')}
        </Button>
      </div>

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
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400">{t('scanner.result.riskScore')}</p>
            <p className={`text-2xl font-mono font-bold ${getRiskColor(result.risk_level)}`} data-testid="risk-score">
              {result.risk_score.toFixed(1)}%
            </p>
          </div>
          <div className="w-px h-12 bg-white/20" />
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-gray-400">{t('scanner.result.confidence')}</p>
            <p className="text-2xl font-mono font-bold">{(result.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Target Info */}
      <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6">
        <h3 className="text-lg font-mono font-bold mb-4">{t('scanner.result.targetInfo')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm font-mono uppercase text-gray-400">{t('scanner.result.target')}</span>
            <span className="font-mono break-all text-right ml-4 rtl:ml-0 rtl:mr-4 ltr-content">{result.target}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm font-mono uppercase text-gray-400">{t('scanner.result.scanType')}</span>
            <span className="font-mono uppercase">{result.scan_type}</span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6">
        <h3 className="text-lg font-mono font-bold mb-4">{t('scanner.result.analysis')}</h3>
        <p className="text-gray-300 font-sans leading-relaxed" data-testid="explanation">{result.explanation}</p>
      </div>

      {/* Details */}
      {result.details && Object.keys(result.details).length > 0 && (
        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6">
          <h3 className="text-lg font-mono font-bold mb-4">{t('scanner.result.additionalDetails')}</h3>
          <div className="space-y-2">
            {Object.entries(result.details).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-sm font-mono uppercase text-gray-400">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-right ml-4 rtl:ml-0 rtl:mr-4 ltr-content">
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