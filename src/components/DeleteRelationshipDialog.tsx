
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

interface Relationship {
  id: number;
  person1_id: number;
  person2_id: number;
  type: string;
  person1_name: string;
  person2_name: string;
  person1_gender: string;
  person2_gender: string;
}

interface DeleteRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: Relationship | null;
  onSuccess: () => void;
}

const DeleteRelationshipDialog = ({ open, onOpenChange, relationship, onSuccess }: DeleteRelationshipDialogProps) => {
  const [loading, setLoading] = useState(false);

  const getRelationshipDescription = (rel: Relationship) => {
    if (rel.type === "parent") {
      if (rel.person1_gender === '男') {
        return `${rel.person1_name} 是 ${rel.person2_name} 的父亲`;
      } else if (rel.person1_gender === '女') {
        return `${rel.person1_name} 是 ${rel.person2_name} 的母亲`;
      } else {
        return `${rel.person1_name} 是 ${rel.person2_name} 的父母`;
      }
    } else if (rel.type === "spouse") {
      if (rel.person1_gender === '男' && rel.person2_gender === '女') {
        return `${rel.person1_name} 是 ${rel.person2_name} 的丈夫`;
      } else if (rel.person1_gender === '女' && rel.person2_gender === '男') {
        return `${rel.person1_name} 是 ${rel.person2_name} 的妻子`;
      } else {
        return `${rel.person1_name} 与 ${rel.person2_name} 是配偶关系`;
      }
    }
    return `${rel.person1_name} 与 ${rel.person2_name} 的关系: ${rel.type}`;
  };

  const handleDelete = async () => {
    if (!relationship) return;

    setLoading(true);
    try {
      console.log("DeleteRelationshipDialog - Deleting relationship:", relationship.id);
      const { error } = await supabase
        .from("Relationship")
        .delete()
        .eq("id", relationship.id);

      if (error) {
        console.error("DeleteRelationshipDialog - Delete error:", error);
        toast({
          title: "删除关系失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("DeleteRelationshipDialog - Delete successful");
        // Log relationship deletion
        await logAuditEvent(AUDIT_ACTIONS.DELETE_RELATIONSHIP, {
          relationship_id: relationship.id,
          person1_id: relationship.person1_id,
          person2_id: relationship.person2_id,
          type: relationship.type
        });
        
        toast({
          title: "删除成功",
          description: "关系已成功删除"
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("DeleteRelationshipDialog - Delete unexpected error:", error);
      toast({
        title: "删除关系失败",
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
          <DialogTitle>确认删除关系</DialogTitle>
          <DialogDescription>
            您确定要删除以下关系吗？
            <br />
            <strong>{relationship && getRelationshipDescription(relationship)}</strong>
            <br />
            此操作不可撤销。
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? "删除中..." : "确认删除"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteRelationshipDialog;
