
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logAuditEvent, AUDIT_ACTIONS } from '@/lib/audit';

interface UserProfile {
  id: string;
  role: 'USER' | 'ADMIN';
  updated_at: string;
  email?: string;
}

interface AuthUser {
  id: string;
  email?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (profileError) {
        toast({
          title: "获取用户失败",
          description: profileError.message,
          variant: "destructive"
        });
        return;
      }

      // Then get user emails from auth.users via admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Could not fetch auth users:', authError);
        // Continue with profiles only, properly typed
        const typedProfiles: UserProfile[] = (profiles || []).map(profile => ({
          id: profile.id,
          role: profile.role as 'USER' | 'ADMIN',
          updated_at: profile.updated_at,
        }));
        setUsers(typedProfiles);
      } else {
        // Merge profile data with email from auth users
        const usersWithEmails: UserProfile[] = (profiles || []).map(profile => {
          const authUser: AuthUser | undefined = authUsers.users.find((user: AuthUser) => user.id === profile.id);
          return {
            id: profile.id,
            role: profile.role as 'USER' | 'ADMIN',
            updated_at: profile.updated_at,
            email: authUser?.email || 'Unknown'
          };
        });
        setUsers(usersWithEmails);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "获取用户失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        toast({
          title: "更新角色失败",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Log the audit event - find the current user before updating
      const currentUser: UserProfile | undefined = users.find(user => user.id === userId);
      await logAuditEvent(AUDIT_ACTIONS.ROLE_CHANGE, {
        target_user_id: userId,
        new_role: newRole,
        previous_role: currentUser?.role
      });

      toast({
        title: "角色更新成功",
        description: `用户角色已更新为 ${newRole === 'ADMIN' ? '管理员' : '普通用户'}`
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "更新角色失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>用户管理</span>
            <Button variant="outline" onClick={fetchUsers}>
              刷新列表
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱</TableHead>
                <TableHead>当前角色</TableHead>
                <TableHead>最后更新</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email || user.id}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'}>
                      {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(newRole: 'USER' | 'ADMIN') => 
                        updateUserRole(user.id, newRole)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">普通用户</SelectItem>
                        <SelectItem value="ADMIN">管理员</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>暂无用户数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminUsers;
