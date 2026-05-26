import React, { useEffect, useState } from 'react';
import { getAdminStats, deleteUser } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Activity, TrendingUp, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import DashboardLayout from '../components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = React.useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load admin stats:', error);
      }
      toast({ 
        title: 'Error', 
        description: 'Failed to load admin data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteUser(userId);
      toast({ title: 'Success', description: 'User deleted successfully' });
      loadStats();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-xl font-mono text-cyber-red">Access Denied</p>
            <p className="text-gray-400 mt-2">Admin privileges required</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-cyber-cyan font-mono">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const threatData = Object.entries(stats?.threat_distribution || {}).map(([name, value]) => ({
    name,
    value,
    fill: name === 'Safe' ? '#00FF94' : name === 'Suspicious' ? '#FFE600' : '#FF2E2E'
  }));

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" data-testid="admin-panel">
        <div className="mb-8">
          <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-gray-400 font-sans">System overview and user management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="total-users-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Total Users</p>
                <p className="text-3xl font-mono font-bold">{stats?.total_users || 0}</p>
              </div>
              <Users className="w-8 h-8 text-cyber-purple" strokeWidth={1.5} />
            </div>
          </div>

          <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="total-scans-admin-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Total Scans</p>
                <p className="text-3xl font-mono font-bold">{stats?.total_scans || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-cyber-cyan" strokeWidth={1.5} />
            </div>
          </div>

          <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="scans-today-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Scans Today</p>
                <p className="text-3xl font-mono font-bold">{stats?.scans_today || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyber-green" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Threat Distribution Chart */}
        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="admin-threat-chart">
          <h2 className="text-xl font-mono font-bold mb-6">System-wide Threat Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121214', border: '1px solid #27272A' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Management */}
        <div className="bg-cyber-gray/50 backdrop-blur-md border border-white/10 p-6" data-testid="user-management">
          <h2 className="text-xl font-mono font-bold mb-6">User Management</h2>
          <div className="space-y-3">
            {stats?.user_list?.map((u) => (
              <div
                key={u.id}
                data-testid={`user-item-${u.id}`}
                className="flex items-center justify-between p-4 bg-black/30 border border-white/5"
              >
                <div>
                  <p className="font-mono font-bold">{u.full_name}</p>
                  <p className="text-sm text-gray-400 font-mono">{u.email}</p>
                  <p className="text-xs text-gray-500 font-mono uppercase mt-1">
                    {u.role} • Joined {format(new Date(u.created_at), 'MMM yyyy')}
                  </p>
                </div>
                {u.id !== user.id && (
                  <Button
                    data-testid={`delete-user-btn-${u.id}`}
                    variant="destructive"
                    size="sm"
                    className="font-mono uppercase"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;