
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, User, Palette, RefreshCw, Bug } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { useUser } from "@/contexts/UserContext";

const Settings = () => {
  const [theme, setTheme] = useState("light");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile, isAdmin, refreshProfile, forceRefreshProfile, debugUpdateRole } = useUser();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    
    toast({
      title: "主题已更新",
      description: `已切换到${newTheme === "dark" ? "深色" : "浅色"}主题`,
    });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "退出失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "已退出登录",
          description: "感谢使用赛博族谱"
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "退出失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    }
  };

  const handleRoleChange = async (newRole: 'USER' | 'ADMIN') => {
    if (!user || !profile) {
      toast({
        title: "权限更新失败",
        description: "用户信息不完整",
        variant: "destructive"
      });
      return;
    }

    if (profile.role === newRole) {
      console.log('Settings - Role is already', newRole, 'no change needed');
      return;
    }

    setIsUpdatingRole(true);
    console.log(`Settings - Starting role change from ${profile.role} to ${newRole} for user ${user.id}`);

    const success = await debugUpdateRole(newRole);
    
    if (success) {
      toast({
        title: "权限更新成功",
        description: `已切换到${newRole === 'ADMIN' ? '管理员' : '普通用户'}权限`,
      });
    } else {
      toast({
        title: "权限更新失败",
        description: "请检查控制台获取详细错误信息",
        variant: "destructive"
      });
    }
    
    setIsUpdatingRole(false);
  };

  const handleDebugCheck = async () => {
    setIsDebugging(true);
    console.log('Settings - Starting debug check...');
    
    if (!user) {
      console.error('Debug - No user found');
      setIsDebugging(false);
      return;
    }

    try {
      // 检查当前用户的认证状态
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Debug - Current session:', sessionData);

      // 检查profiles表中的数据
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      console.log('Debug - Profile query result:', { data: profileData, error: profileError });

      // 检查RLS策略
      const { data: rlsTest, error: rlsError } = await supabase
        .from('profiles')
        .select('*');

      console.log('Debug - RLS test (all profiles):', { data: rlsTest, error: rlsError });

      toast({
        title: "调试检查完成",
        description: "请查看控制台获取详细信息"
      });
    } catch (error) {
      console.error('Debug - Error:', error);
      toast({
        title: "调试检查失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    }
    
    setIsDebugging(false);
  };

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    console.log('Settings - Manual refresh triggered');
    
    try {
      await forceRefreshProfile();
      toast({
        title: "刷新完成",
        description: "用户信息已更新"
      });
    } catch (error) {
      console.error('Settings - Manual refresh error:', error);
      toast({
        title: "刷新失败",
        description: "无法更新用户信息",
        variant: "destructive"
      });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <GlobalHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">请先登录以访问设置页面</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <GlobalHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">系统设置</h1>
              <p className="text-gray-600 dark:text-gray-300">个性化您的族谱管理体验</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 用户权限设置 */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>用户权限</span>
              </CardTitle>
              <CardDescription>
                管理您的系统访问权限
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">当前权限</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? "管理员" : "普通用户"}
                    </Badge>
                    {(isUpdatingRole || isManualRefreshing) && <RefreshCw className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select 
                    value={profile?.role || 'USER'} 
                    onValueChange={(value: 'USER' | 'ADMIN') => handleRoleChange(value)}
                    disabled={isUpdatingRole}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">普通用户</SelectItem>
                      <SelectItem value="ADMIN">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRefresh}
                    disabled={isManualRefreshing}
                    title="手动刷新用户信息"
                  >
                    <RefreshCw className={`h-4 w-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* 调试按钮 */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDebugCheck}
                  disabled={isDebugging}
                  className="w-full"
                >
                  <Bug className={`h-4 w-4 mr-2 ${isDebugging ? 'animate-spin' : ''}`} />
                  调试检查权限问题
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>• 管理员：可以添加、编辑、删除家族成员</p>
                <p>• 普通用户：只能查看家族信息</p>
                <p>• 如果权限显示不正确，请点击调试按钮检查问题</p>
              </div>
            </CardContent>
          </Card>

          {/* 主题设置 */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>界面主题</span>
              </CardTitle>
              <CardDescription>
                选择您喜欢的界面颜色主题
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-toggle" className="text-sm font-medium">
                  深色模式
                </Label>
                <Switch
                  id="theme-toggle"
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeChange}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                深色主题可以减少眼部疲劳，特别适合在低光环境下使用
              </div>
            </CardContent>
          </Card>

          {/* 账户管理 */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm md:col-span-2">
            <CardHeader>
              <CardTitle>账户管理</CardTitle>
              <CardDescription>
                管理您的登录状态和账户安全
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    当前登录邮箱
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20"
                >
                  退出登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
