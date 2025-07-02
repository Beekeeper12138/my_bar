
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddMemberDialog = ({ open, onOpenChange, onSuccess }: AddMemberDialogProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    gender: "",
    birth_date: "",
    death_date: "",
    birth_place: "",
    residence: "",
    biography: "",
    photo_path: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Setting ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    console.log("Form data before validation:", formData);
    
    if (!formData.full_name || !formData.gender || !formData.birth_date || !formData.birth_place) {
      toast({
        title: "请填写必填字段",
        description: "姓名、性别、出生日期和出生地为必填项",
        variant: "destructive"
      });
      return;
    }

    // 验证性别值
    if (formData.gender !== '男' && formData.gender !== '女') {
      console.error("Invalid gender value:", formData.gender);
      toast({
        title: "性别值无效",
        description: "性别必须是'男'或'女'",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        death_date: formData.death_date || null,
        residence: formData.residence || null,
        biography: formData.biography || null,
        photo_path: formData.photo_path || null
      };

      console.log("AddMemberDialog - Creating individual with data:", submitData);
      const { data, error } = await supabase
        .from("Individual")
        .insert([submitData])
        .select()
        .single();

      if (error) {
        console.error("AddMemberDialog - Create error:", error);
        toast({
          title: "添加失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("AddMemberDialog - Create successful:", data);
        // Log individual creation
        await logAuditEvent(AUDIT_ACTIONS.CREATE_INDIVIDUAL, {
          individual_id: data.id,
          full_name: data.full_name,
          gender: data.gender
        });
        
        toast({
          title: "添加成功",
          description: "家族成员已成功添加"
        });
        setFormData({
          full_name: "",
          gender: "",
          birth_date: "",
          death_date: "",
          birth_place: "",
          residence: "",
          biography: "",
          photo_path: ""
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("AddMemberDialog - Create unexpected error:", error);
      toast({
        title: "添加失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加新成员</DialogTitle>
          <DialogDescription>
            填写家族成员的详细信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">姓名 *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="请输入姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">性别 *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
              </SelectContent>
            </Select>
            {formData.gender && (
              <div className="text-xs text-gray-500">
                已选择: {formData.gender}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">出生日期 *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleInputChange("birth_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="death_date">逝世日期</Label>
            <Input
              id="death_date"
              type="date"
              value={formData.death_date}
              onChange={(e) => handleInputChange("death_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_place">出生地 *</Label>
            <Input
              id="birth_place"
              value={formData.birth_place}
              onChange={(e) => handleInputChange("birth_place", e.target.value)}
              placeholder="请输入出生地"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="residence">居住地</Label>
            <Input
              id="residence"
              value={formData.residence}
              onChange={(e) => handleInputChange("residence", e.target.value)}
              placeholder="请输入居住地"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_path">照片链接</Label>
            <Input
              id="photo_path"
              value={formData.photo_path}
              onChange={(e) => handleInputChange("photo_path", e.target.value)}
              placeholder="请输入照片URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="biography">生平简介</Label>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => handleInputChange("biography", e.target.value)}
              placeholder="请输入生平简介"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "添加中..." : "添加"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
