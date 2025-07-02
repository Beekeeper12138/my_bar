
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  redirectTo = '/dashboard'
}) => {
  const { user, profile, loading } = useUser();

  // 显示加载状态，但有超时保护
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">加载中...</div>
          <div className="text-sm text-gray-500">正在验证用户身份</div>
        </div>
      </div>
    );
  }

  // 用户未登录，重定向到首页
  if (!user) {
    console.log('User not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // 需要管理员权限但用户不是管理员
  if (requireAdmin && profile?.role !== 'ADMIN') {
    console.log('Admin required but user is not admin, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
