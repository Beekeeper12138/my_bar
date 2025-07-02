import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface AddRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndividual: Individual;
  onSuccess: () => void;
}

const AddRelationshipDialog = ({ open, onOpenChange, currentIndividual, onSuccess }: AddRelationshipDialogProps) => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchIndividuals();
    }
  }, [open]);

  const fetchIndividuals = async () => {
    try {
      const { data, error } = await supabase
        .from("Individual")
        .select("*")
        .neq("id", currentIndividual.id)
        .order("full_name");

      if (error) {
        toast({
          title: "获取成员失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setIndividuals(data || []);
      }
    } catch (error) {
      toast({
        title: "获取成员失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedPersonId || !relationshipType) {
      toast({
        title: "请完整填写信息",
        description: "请选择关系人员和关系类型",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let person1Id, person2Id;

      if (relationshipType === 'parent') {
        // 如果是父母关系，当前人员是子女，选中的人员是父母
        person1Id = parseInt(selectedPersonId);
        person2Id = currentIndividual.id;
      } else {
        // 配偶关系可以是任意顺序
        person1Id = currentIndividual.id;
        person2Id = parseInt(selectedPersonId);
      }

      console.log("AddRelationshipDialog - Creating relationship:", { person1Id, person2Id, relationshipType });
      const { error } = await supabase
        .from("Relationship")
        .insert([{
          person1_id: person1Id,
          person2_id: person2Id,
          type: relationshipType
        }]);

      if (error) {
        console.error("AddRelationshipDialog - Create error:", error);
        toast({
          title: "添加关系失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("AddRelationshipDialog - Create successful");
        // Log relationship creation
        await logAuditEvent(AUDIT_ACTIONS.CREATE_RELATIONSHIP, {
          person1_id: person1Id,
          person2_id: person2Id,
          type: relationshipType,
          context: 'member_detail_page'
        });
        
        toast({
          title: "添加关系成功",
          description: "家族关系已成功添加"
        });
        setSelectedPersonId("");
        setRelationshipType("");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("AddRelationshipDialog - Create unexpected error:", error);
      toast({
        title: "添加关系失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加家族关系</DialogTitle>
          <DialogDescription>
            为 <strong>{currentIndividual.full_name}</strong> 添加家族关系
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="relationship_type">关系类型</Label>
            <Select onValueChange={setRelationshipType}>
              <SelectTrigger>
                <SelectValue placeholder="请选择关系类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">父母</SelectItem>
                <SelectItem value="spouse">配偶</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="person_select">选择关系人员</Label>
            <Select onValueChange={setSelectedPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择人员" />
              </SelectTrigger>
              <SelectContent>
                {individuals.map((individual) => (
                  <SelectItem key={individual.id} value={individual.id.toString()}>
                    {individual.full_name} ({individual.gender}, {new Date(individual.birth_date).getFullYear()}年生)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "添加中..." : "添加关系"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRelationshipDialog;
