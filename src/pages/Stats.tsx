
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TreePine, BarChart, PieChart, LineChart } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';

interface Individual {
  id: number;
  full_name: string;
  gender: string;
  birth_date: string | null;
  death_date: string | null;
  created_at: string;
}

interface DecadeData {
  decade: string;
  count: number;
}

interface GenderData {
  name: string;
  value: number;
  color: string;
}

interface GrowthData {
  month: string;
  count: number;
}

const Stats = () => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [decadeData, setDecadeData] = useState<DecadeData[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('统计页面：开始获取数据...');
      setLoading(true);
      
      console.log('统计页面：查询 Individual 表...');
      const { data: individualData, error: individualError } = await supabase
        .from("Individual")
        .select("*")
        .order("created_at");

      console.log('统计页面：Individual表查询结果:', { data: individualData, error: individualError });

      if (individualError) {
        console.error('统计页面：数据库查询错误:', individualError);
        toast({
          title: "获取数据失败",
          description: `数据库错误: ${individualError.message}`,
          variant: "destructive"
        });
        setIndividuals([]);
        setEmptyChartData();
      } else if (!individualData || individualData.length === 0) {
        console.warn('统计页面：数据库中没有找到任何记录');
        toast({
          title: "暂无数据",
          description: "数据库中暂无家族成员记录，请先添加成员",
          variant: "default"
        });
        setIndividuals([]);
        setEmptyChartData();
      } else {
        console.log('统计页面：成功获取数据，开始处理统计信息...');
        console.log('统计页面：数据详情:', individualData);
        setIndividuals(individualData);
        processStatistics(individualData);
      }
    } catch (error) {
      console.error('统计页面：获取数据时发生异常:', error);
      toast({
        title: "获取数据失败",
        description: "发生未知错误，请检查网络连接",
        variant: "destructive"
      });
      setIndividuals([]);
      setEmptyChartData();
    } finally {
      setLoading(false);
    }
  };

  const setEmptyChartData = () => {
    setDecadeData([]);
    setGenderData([
      { name: '男性', value: 0, color: '#3b82f6' },
      { name: '女性', value: 0, color: '#ec4899' }
    ]);
    setGrowthData([]);
  };

  // 添加辅助函数来判断性别
  const isMale = (gender: string) => gender === 'male' || gender === '男';
  const isFemale = (gender: string) => gender === 'female' || gender === '女';

  const processStatistics = (data: Individual[]) => {
    console.log('=== 开始处理统计数据 ===');
    console.log('待处理的个人数据总数:', data.length);
    
    // 处理出生年代数据
    console.log('--- 处理年代数据 ---');
    const decadeCounts: { [key: string]: number } = {};
    let validBirthDates = 0;
    
    data.forEach((person, index) => {
      console.log(`处理第 ${index + 1} 个人: ${person.full_name}, 出生日期: ${person.birth_date}`);
      
      if (person.birth_date) {
        const year = new Date(person.birth_date).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}年代`;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        validBirthDates++;
        console.log(`  -> 年份: ${year}, 年代: ${decade}, 当前计数: ${decadeCounts[decade]}`);
      } else {
        console.log(`  -> ${person.full_name} 无出生日期`);
      }
    });

    console.log('最终年代统计:', decadeCounts);
    console.log('有效出生日期数量:', validBirthDates);

    const sortedDecades = Object.entries(decadeCounts)
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade.localeCompare(b.decade));

    console.log('排序后的年代数据:', sortedDecades);
    setDecadeData(sortedDecades);

    // 处理性别分布数据 - 修复中文性别识别
    console.log('--- 处理性别数据 ---');
    const genderCounts = { male: 0, female: 0, other: 0 };
    
    data.forEach((person, index) => {
      console.log(`处理第 ${index + 1} 个人: ${person.full_name}, 性别: "${person.gender}"`);
      
      // 支持中文和英文性别值
      if (person.gender === 'male' || person.gender === '男') {
        genderCounts.male++;
        console.log(`  -> 识别为男性，当前男性计数: ${genderCounts.male}`);
      } else if (person.gender === 'female' || person.gender === '女') {
        genderCounts.female++;
        console.log(`  -> 识别为女性，当前女性计数: ${genderCounts.female}`);
      } else {
        genderCounts.other++;
        console.log(`  -> 未识别的性别值: "${person.gender}"`);
      }
    });

    console.log('最终性别统计:', genderCounts);

    const genderDisplayData = [
      { 
        name: '男性', 
        value: genderCounts.male, 
        color: '#3b82f6' 
      },
      { 
        name: '女性', 
        value: genderCounts.female, 
        color: '#ec4899' 
      }
    ];

    console.log('性别图表数据:', genderDisplayData);
    setGenderData(genderDisplayData);

    // 处理成员增长数据
    console.log('--- 处理增长数据 ---');
    const monthCounts: { [key: string]: number } = {};
    
    data.forEach(person => {
      const date = new Date(person.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      console.log(`增长数据: ${person.full_name} 添加于 ${monthKey}`);
    });

    const sortedGrowth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // 只显示最近12个月

    console.log('增长图表数据:', sortedGrowth);
    setGrowthData(sortedGrowth);
    
    console.log('=== 统计数据处理完成 ===');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <GlobalHeader onRefresh={fetchData} showRefresh={true} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <GlobalHeader onRefresh={fetchData} showRefresh={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">族谱统计分析</h1>
          <p className="text-gray-600">深入了解您的家族数据</p>
          
          {/* Debug Information */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">调试信息:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>总成员数: {individuals.length}</p>
              <p>年代数据点: {decadeData.length}</p>
              <p>性别数据: 男性 {genderData.find(g => g.name === '男性')?.value || 0} 人, 女性 {genderData.find(g => g.name === '女性')?.value || 0} 人</p>
              <p>增长数据点: {growthData.length}</p>
              <p>最近查询时间: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 统计概览 - 修复性别过滤器 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总成员数</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{individuals.length}</div>
              <p className="text-xs text-muted-foreground">
                记录在册的家族成员
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">男性成员</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {individuals.filter(p => isMale(p.gender)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                占总数 {individuals.length > 0 ? ((individuals.filter(p => isMale(p.gender)).length / individuals.length) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">女性成员</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {individuals.filter(p => isFemale(p.gender)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                占总数 {individuals.length > 0 ? ((individuals.filter(p => isFemale(p.gender)).length / individuals.length) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">在世成员</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {individuals.filter(p => !p.death_date).length}
              </div>
              <p className="text-xs text-muted-foreground">
                占总数 {individuals.length > 0 ? ((individuals.filter(p => !p.death_date).length / individuals.length) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 出生年代分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="h-5 w-5" />
                <span>出生年代分布</span>
              </CardTitle>
              <CardDescription>
                按年代统计家族成员出生分布情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decadeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={decadeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="decade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="人数" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  暂无年代分布数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 性别分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>性别分布</span>
              </CardTitle>
              <CardDescription>
                家族成员性别比例统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              {genderData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => {
                        console.log('饼图标签渲染:', { name, value, percent });
                        return value > 0 ?`${name}: ${value}人 (${(percent * 100).toFixed(0)}%)` : null;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => {
                        console.log('渲染饼图单元格:', entry, index);
                        return <Cell key={`cell-${index}`} fill={entry.color} />;
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => {
                        console.log('饼图工具提示:', { value, name });
                        return [`${value}人`, name];
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  暂无性别分布数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 成员增长趋势 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>成员增长趋势</span>
              </CardTitle>
              <CardDescription>
                最近12个月新增家族成员统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              {growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="新增成员数"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  暂无增长趋势数据
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Stats;
