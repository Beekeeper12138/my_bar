
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Lock } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

interface Event {
  id: number;
  title: string;
  date: string;
  description: string;
  created_at: string | null;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: ""
  });
  const { toast } = useToast();
  const { isAdmin } = useUser();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log("Events - Fetching events...");
      const { data, error } = await supabase
        .from("event")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Events - Fetch error:", error);
        toast({
          title: "获取事件数据失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Events - Fetch successful:", data?.length);
        setEvents(data || []);
      }
    } catch (error) {
      console.error("Events - Unexpected error:", error);
      toast({
        title: "获取事件数据失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!isAdmin) {
      toast({
        title: "权限不足",
        description: "普通用户无修改权限",
        variant: "destructive"
      });
      return;
    }

    if (!newEvent.title || !newEvent.date || !newEvent.description) {
      toast({
        title: "请填写完整信息",
        description: "请填写事件标题、日期和描述",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      console.log("Events - Creating event:", newEvent);
      const { error } = await supabase
        .from("event")
        .insert({
          title: newEvent.title,
          date: newEvent.date,
          description: newEvent.description
        });

      if (error) {
        console.error("Events - Create error:", error);
        toast({
          title: "创建事件失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Events - Create successful");
        // Log event creation
        await logAuditEvent(AUDIT_ACTIONS.CREATE_EVENT, {
          title: newEvent.title,
          date: newEvent.date
        });
        
        toast({
          title: "事件创建成功",
          description: "新事件已成功创建"
        });
        
        // Clear form and close dialog
        setNewEvent({ title: "", date: "", description: "" });
        setShowCreateDialog(false);
        
        // Refresh events
        await fetchEvents();
      }
    } catch (error) {
      console.error("Events - Create unexpected error:", error);
      toast({
        title: "创建事件失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDialogClick = () => {
    if (!isAdmin) {
      toast({
        title: "权限不足",
        description: "普通用户无修改权限",
        variant: "destructive"
      });
      return;
    }
    setShowCreateDialog(true);
  };

  const handleRefresh = () => {
    console.log("Events - Refreshing data...");
    logAuditEvent('REFRESH_DATA', { page: 'events' });
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <GlobalHeader onRefresh={handleRefresh} showRefresh={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">事件管理</h1>
          <p className="text-gray-600">创建和管理家族重要事件</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>家族事件 ({events.length})</CardTitle>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={handleCreateDialogClick}
                    disabled={!isAdmin}
                    variant={isAdmin ? "default" : "secondary"}
                  >
                    {isAdmin ? (
                      <Plus className="h-4 w-4 mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    创建新事件
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建新事件</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        事件标题
                      </label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="输入事件标题"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        事件日期
                      </label>
                      <Input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        事件描述
                      </label>
                      <Textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="输入事件描述"
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={handleCreateEvent} 
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? "创建中..." : "创建事件"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {!isAdmin && (
                <span className="text-sm text-gray-500">普通用户无修改权限</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>事件标题</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>
                        {new Date(event.date).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {event.description}
                      </TableCell>
                      <TableCell>
                        {event.created_at ? new Date(event.created_at).toLocaleDateString('zh-CN') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无事件记录，{isAdmin ? "点击上方按钮创建新事件" : "需要管理员权限创建事件"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Events;
