import React, { useEffect, useState, useCallback } from 'react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load stats:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-cyber-cyan font-mono">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const threatData = [
    { name: 'Safe', value: stats?.safe_count || 0, color: '#00FF94' },
    { name: 'Suspicious', value: stats?.suspicious_count || 0, color: '#FFE600' },
    { name: 'Malicious', value: stats?.malicious_count || 0, color: '#FF2E2E' }
  ];

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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" data-testid="dashboard-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">
            Welcome, <span className="text-cyber-cyan">{user?.full_name}</span>
          </h1>
          <p className="text-gray-400 font-sans">Security Command Center</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Scans"
            value={stats?.total_scans || 0}
            icon={Shield}
            testId="total-scans-card"
          />
          <StatCard
            title="Safe"
            value={stats?.safe_count || 0}
            icon={CheckCircle2}
            color="green"
            delay={0.1}
            testId="safe-count-card"
          />
          <StatCard
            title="Suspicious"
            value={stats?.suspicious_count || 0}
            icon={AlertTriangle}
            color="yellow"
            delay={0.2}
            testId="suspicious-count-card"
          />
          <StatCard
            title="Malicious"
            value={stats?.malicious_count || 0}
            icon={AlertTriangle}
            color="red"
            delay={0.3}
            testId="malicious-count-card"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="threat-chart">
            <h2 className="text-xl font-mono font-bold mb-6">Threat Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="recent-activity">
            <h2 className="text-xl font-mono font-bold mb-6">Recent Activity</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.recent_scans?.slice(0, 5).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-black/30 border border-white/5">
                  <div className="flex-1">
                    <p className="font-mono text-sm truncate">{scan.target}</p>
                    <p className="text-xs text-gray-500 font-mono">{scan.scan_type.toUpperCase()}</p>
                  </div>
                  <div className={`px-3 py-1 border font-mono text-xs uppercase ${getRiskBg(scan.risk_level)} ${getRiskColor(scan.risk_level)}`}>
                    {scan.risk_level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;