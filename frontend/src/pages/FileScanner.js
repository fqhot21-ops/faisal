import React, { useState } from 'react';
import { scanFile } from '../services/api';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import DashboardLayout from '../components/DashboardLayout';
import ScanResult from '../components/ScanResult';

const FileScanner = () => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await scanFile(file);
      setResult(data);
      toast({ title: 'Success', description: 'File scan completed' });
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
      <div className="p-6 max-w-4xl mx-auto" data-testid="file-scanner-page">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">File Scanner</h1>
          <p className="text-gray-400 font-sans">Upload files for malware detection</p>
        </div>

        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-8 mb-6">
          <form onSubmit={handleScan} className="space-y-6" data-testid="file-scan-form">
            <div>
              <Label htmlFor="file" className="font-mono text-xs uppercase tracking-wider text-gray-400 mb-2 block">
                Select File
              </Label>
              <div className="relative">
                <input
                  id="file"
                  data-testid="file-input"
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-400 font-mono
                    file:mr-4 file:py-3 file:px-6
                    file:border-0
                    file:font-mono file:uppercase file:font-bold
                    file:bg-cyber-cyan file:text-black
                    hover:file:bg-cyber-cyan/80
                    file:cursor-pointer
                    bg-black/50 border border-white/20 p-3"
                  required
                />
              </div>
              {file && (
                <p className="mt-2 text-sm text-gray-500 font-mono">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              type="submit"
              data-testid="scan-file-btn"
              className="w-full font-mono uppercase bg-cyber-cyan text-black hover:bg-cyber-cyan/80"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan File'
              )}
            </Button>
          </form>
        </div>

        {result && <ScanResult result={result} />}
      </div>
    </DashboardLayout>
  );
};

export default FileScanner;