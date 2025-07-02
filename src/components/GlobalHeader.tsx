
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { TreePine, RefreshCcw, Shield } from "lucide-react";
import { useUser } from '@/contexts/UserContext';

interface GlobalHeaderProps {
  onRefresh?: () => void;
  showRefresh?: boolean;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onRefresh, showRefresh = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUser();

  const isActive = (path: string) => location.pathname === path;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <TreePine className="h-8 w-8 text-indigo-600" />
            <h1 
              className="text-xl font-bold text-gray-900 cursor-pointer" 
              onClick={() => navigate("/")}
            >
              赛博族谱
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Button 
              variant={isActive("/stats") ? "default" : "ghost"} 
              onClick={() => navigate("/stats")}
              size="sm"
            >
              统计分析
            </Button>
            <Button 
              variant={isActive("/branches") ? "default" : "ghost"} 
              onClick={() => navigate("/branches")}
              size="sm"
            >
              家族分支
            </Button>
            <Button 
              variant={isActive("/events") ? "default" : "ghost"} 
              onClick={() => navigate("/events")}
              size="sm"
            >
              事件记录
            </Button>
            <Button 
              variant={isActive("/relationships") ? "default" : "ghost"} 
              onClick={() => navigate("/relationships")}
              size="sm"
            >
              关系管理
            </Button>
            <Button 
              variant={isActive("/dashboard") ? "default" : "ghost"} 
              onClick={() => navigate("/dashboard")}
              size="sm"
            >
              仪表板
            </Button>
            <Button 
              variant={isActive("/tree") ? "default" : "ghost"} 
              onClick={() => navigate("/tree")}
              size="sm"
            >
              族谱图
            </Button>
            <Button 
              variant={isActive("/settings") ? "default" : "ghost"} 
              onClick={() => navigate("/settings")}
              size="sm"
            >
              设置
            </Button>
            
            {/* Admin Panel Link - Only visible to admins */}
            {isAdmin && (
              <Button 
                variant={location.pathname.startsWith("/admin") ? "default" : "ghost"} 
                onClick={() => navigate("/admin/users")}
                size="sm"
                className="ml-2 border-l border-gray-200 pl-2"
              >
                <Shield className="h-4 w-4 mr-2" />
                管理面板
              </Button>
            )}
            
            {/* Refresh Button */}
            <div className="border-l border-gray-200 pl-4 ml-4">
              <Button 
                variant="ghost" 
                onClick={handleRefresh}
                size="sm"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                刷新数据
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
