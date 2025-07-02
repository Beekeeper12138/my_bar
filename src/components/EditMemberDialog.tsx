
import { useState, useEffect } from "react";
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

interface Individual {
  id: number;
  full_name: string;
  gender: string;
  birth_date: string;
  death_date?: string;
  birth_place: string;
  residence?: string;
  biography?: string;
  photo_path?: string;
}

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  individual: Individual | null;
  onSuccess: () => void;
}

const EditMemberDialog = ({ open, onOpenChange, individual, onSuccess }: EditMemberDialogProps) => {
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

  useEffect(() => {
    if (individual) {
      console.log("EditMemberDialog - Setting form data with individual:", individual);
      setFormData({
        full_name: individual.full_name,
        gender: individual.gender,
        birth_date: individual.birth_date,
        death_date: individual.death_date || "",
        birth_place: individual.birth_place,
        residence: individual.residence || "",
        biography: individual.biography || "",
        photo_path: individual.photo_path || ""
      });
    }
  }, [individual]);

  const handleInputChange = (field: string, value: string) => {
    console.log("EditMemberDialog - Field change:", field, "Value:", value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!individual) return;

    if (!formData.full_name || !formData.gender || !formData.birth_date || !formData.birth_place) {
      toast({
        title: "请填写必填字段",
        description: "姓名、性别、出生日期和出生地为必填项",
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

      console.log("EditMemberDialog - Updating individual:", individual.id, submitData);
      const { error } = await supabase
        .from("Individual")
        .update(submitData)
        .eq("id", individual.id);

      if (error) {
        console.error("EditMemberDialog - Update error:", error);
        toast({
          title: "更新失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("EditMemberDialog - Update successful");
        // Log individual update
        await logAuditEvent(AUDIT_ACTIONS.UPDATE_INDIVIDUAL, {
          individual_id: individual.id,
          full_name: formData.full_name,
          changes: submitData
        });
        
        toast({
          title: "更新成功",
          description: "家族成员信息已成功更新"
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("EditMemberDialog - Update unexpected error:", error);
      toast({
        title: "更新失败",
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
          <DialogTitle>编辑成员信息</DialogTitle>
          <DialogDescription>
            修改家族成员的详细信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_full_name">姓名 *</Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              placeholder="请输入姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_gender">性别 *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_birth_date">出生日期 *</Label>
            <Input
              id="edit_birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleInputChange("birth_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_death_date">逝世日期</Label>
            <Input
              id="edit_death_date"
              type="date"
              value={formData.death_date}
              onChange={(e) => handleInputChange("death_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_birth_place">出生地 *</Label>
            <Input
              id="edit_birth_place"
              value={formData.birth_place}
              onChange={(e) => handleInputChange("birth_place", e.target.value)}
              placeholder="请输入出生地"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_residence">居住地</Label>
            <Input
              id="edit_residence"
              value={formData.residence}
              onChange={(e) => handleInputChange("residence", e.target.value)}
              placeholder="请输入居住地"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_photo_path">照片链接</Label>
            <Input
              id="edit_photo_path"
              value={formData.photo_path}
              onChange={(e) => handleInputChange("photo_path", e.target.value)}
              placeholder="请输入照片URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_biography">生平简介</Label>
            <Textarea
              id="edit_biography"
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
              {loading ? "更新中..." : "更新"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemberDialog;
