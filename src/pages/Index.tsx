
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Users, TreePine, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AuthDialog from "@/components/AuthDialog";

const Index = () => {
  const [user, setUser] = useState(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 检查当前用户状态
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    checkUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <TreePine className="h-8 w-8 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">赛博族谱</h1>
            </div>
            <div className="flex space-x-4">
              {!user && (
                <>
                  <Button variant="ghost" onClick={() => setShowAuthDialog(true)}>
                    登录
                  </Button>
                  <Button onClick={() => setShowAuthDialog(true)}>
                    注册
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 英雄区域 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            数字化家族传承
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            用现代科技记录家族历史，让每一代人的故事得以传承。
            创建您的数字族谱，连接过去、现在与未来。
          </p>
          {!user && (
            <Button 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowAuthDialog(true)}
            >
              开始创建族谱
            </Button>
          )}
        </div>

        {/* 功能特色 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">家族成员管理</h3>
              <p className="text-gray-600">
                记录每位家族成员的详细信息，包括生平、照片和重要事件
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TreePine className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">关系网络</h3>
              <p className="text-gray-600">
                建立完整的家族关系网，追溯祖先，记录后代
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">历史事件</h3>
              <p className="text-gray-600">
                记录家族重要历史事件，保存珍贵的家族记忆
              </p>
            </CardHeader>
          </Card>
        </div>

        {/* 关于项目 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            关于赛博族谱
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p className="text-lg mb-4">
              赛博族谱是一个现代化的数字家谱管理平台，旨在帮助家族保存和传承宝贵的历史记忆。
              通过我们的平台，您可以：
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>详细记录每位家族成员的生平信息</li>
              <li>建立完整的家族关系网络</li>
              <li>上传并保存珍贵的家族照片</li>
              <li>记录重要的家族历史事件</li>
              <li>创建多个家族分支管理不同支系</li>
            </ul>
            <p className="text-lg">
              让科技为传统文化服务，让每一个家族的故事都能被完整地记录和传承下去。
            </p>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 赛博族谱. 传承家族文化，连接过去未来。</p>
        </div>
      </footer>

      {/* 认证对话框 */}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
