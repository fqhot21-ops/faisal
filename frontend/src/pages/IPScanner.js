import React, { useState } from 'react';
import { scanIP } from '../services/api';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import DashboardLayout from '../components/DashboardLayout';
import ScanResult from '../components/ScanResult';

const IPScanner = () => {
  const { toast } = useToast();
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!ip) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await scanIP(ip);
      setResult(data);
      toast({ title: 'Success', description: 'IP scan completed' });
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
      <div className="p-6 max-w-4xl mx-auto" data-testid="ip-scanner-page">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">IP Reputation Check</h1>
          <p className="text-gray-400 font-sans">Check IP address reputation and geolocation</p>
        </div>

        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-8 mb-6">
          <form onSubmit={handleScan} className="space-y-6" data-testid="ip-scan-form">
            <div>
              <Label htmlFor="ip" className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-2 block">
                IP Address
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" strokeWidth={1.5} />
                <Input
                  id="ip"
                  data-testid="ip-input"
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="8.8.8.8"
                  className="pl-10 bg-black/50 border-white/20 focus:border-cyber-cyan font-mono"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="scan-ip-btn"
              className="w-full font-mono uppercase bg-cyber-cyan text-black hover:bg-cyber-cyan/80"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check IP'
              )}
            </Button>
          </form>
        </div>

        {result && <ScanResult result={result} />}
      </div>
    </DashboardLayout>
  );
};

export default IPScanner;