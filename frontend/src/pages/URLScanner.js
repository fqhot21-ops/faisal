import React, { useState } from 'react';
import { scanURL } from '../services/api';
import { Link2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import DashboardLayout from '../components/DashboardLayout';
import ScanResult from '../components/ScanResult';

const URLScanner = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await scanURL(url);
      setResult(data);
      toast({ title: 'Success', description: 'URL scan completed' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Scan failed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto" data-testid="url-scanner-page">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">URL Threat Scanner</h1>
          <p className="text-gray-400 font-sans">Analyze URLs for security threats using AI</p>
        </div>

        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-8 mb-6">
          <form onSubmit={handleScan} className="space-y-6" data-testid="url-scan-form">
            <div>
              <Label htmlFor="url" className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-2 block">
                URL to Scan
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" strokeWidth={1.5} />
                <Input
                  id="url"
                  data-testid="url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-10 bg-black/50 border-white/20 focus:border-cyber-cyan font-mono"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="scan-url-btn"
              className="w-full font-mono uppercase bg-cyber-cyan text-black hover:bg-cyber-cyan/80"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan URL'
              )}
            </Button>
          </form>
        </div>

        {result && <ScanResult result={result} />}
      </div>
    </DashboardLayout>
  );
};

export default URLScanner;