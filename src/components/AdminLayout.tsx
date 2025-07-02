
import React from 'react';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, FileText, Settings, Home } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <GlobalHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员面板</h1>
              <p className="text-gray-600">系统管理和监控</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              返回主界面
            </Button>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="flex space-x-1 p-1">
            <Button
              variant={isActive('/admin/users') ? 'default' : 'ghost'}
              onClick={() => navigate('/admin/users')}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              用户管理
            </Button>
            <Button
              variant={isActive('/admin/logs') ? 'default' : 'ghost'}
              onClick={() => navigate('/admin/logs')}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              审计日志
            </Button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
