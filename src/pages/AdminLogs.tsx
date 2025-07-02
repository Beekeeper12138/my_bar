
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, Filter, RefreshCcw } from 'lucide-react';

interface AuditLog {
  id: number;
  created_at: string;
  user_id: string;
  action: string;
  details: any;
  user_email?: string;
}

const AdminLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 50;

  const fetchLogs = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setPage(0);
      }

      const currentPage = loadMore ? page : 0;
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "获取审计日志失败",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      const newLogs = data || [];
      setHasMore(newLogs.length === ITEMS_PER_PAGE);
      
      if (loadMore) {
        setLogs(prev => [...prev, ...newLogs]);
        setPage(currentPage + 1);
      } else {
        setLogs(newLogs);
        setPage(1);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "获取审计日志失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('CREATE')) return 'default';
    if (action.includes('UPDATE')) return 'secondary';
    if (action.includes('DELETE')) return 'destructive';
    return 'outline';
  };

  const getActionDisplayName = (action: string) => {
    const actionMap: Record<string, string> = {
      'CREATE_INDIVIDUAL': '创建个人',
      'UPDATE_INDIVIDUAL': '更新个人',
      'DELETE_INDIVIDUAL': '删除个人',
      'CREATE_RELATIONSHIP': '创建关系',
      'DELETE_RELATIONSHIP': '删除关系',
      'CREATE_EVENT': '创建事件',
      'UPDATE_EVENT': '更新事件',
      'DELETE_EVENT': '删除事件',
      'ROLE_CHANGE': '角色变更',
      'USER_LOGIN': '用户登录',
      'USER_LOGOUT': '用户退出'
    };
    return actionMap[action] || action;
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    
    try {
      const formatted = Object.entries(details)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
      return formatted.length > 100 ? formatted.substring(0, 100) + '...' : formatted;
    } catch {
      return JSON.stringify(details).substring(0, 100) + '...';
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>审计日志</span>
            <div className="flex items-center space-x-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="筛选操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有操作</SelectItem>
                  <SelectItem value="CREATE_INDIVIDUAL">创建个人</SelectItem>
                  <SelectItem value="UPDATE_INDIVIDUAL">更新个人</SelectItem>
                  <SelectItem value="DELETE_INDIVIDUAL">删除个人</SelectItem>
                  <SelectItem value="CREATE_RELATIONSHIP">创建关系</SelectItem>
                  <SelectItem value="DELETE_RELATIONSHIP">删除关系</SelectItem>
                  <SelectItem value="ROLE_CHANGE">角色变更</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fetchLogs()}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">加载中...</div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {log.user_id?.substring(0, 8)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {getActionDisplayName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDetails(log.details)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无审计日志</p>
                </div>
              )}

              {hasMore && logs.length > 0 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchLogs(true)}
                    disabled={loading}
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminLogs;
