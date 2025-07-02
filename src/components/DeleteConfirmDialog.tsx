
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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  individual: Individual | null;
  onSuccess: () => void;
}

const DeleteConfirmDialog = ({ open, onOpenChange, individual, onSuccess }: DeleteConfirmDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!individual) return;

    setLoading(true);
    try {
      console.log("DeleteConfirmDialog - Deleting individual:", individual.id);
      const { error } = await supabase
        .from("Individual")
        .delete()
        .eq("id", individual.id);

      if (error) {
        console.error("DeleteConfirmDialog - Delete error:", error);
        toast({
          title: "删除失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("DeleteConfirmDialog - Delete successful");
        // Log individual deletion
        await logAuditEvent(AUDIT_ACTIONS.DELETE_INDIVIDUAL, {
          individual_id: individual.id,
          full_name: individual.full_name
        });
        
        toast({
          title: "删除成功",
          description: "家族成员已成功删除"
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("DeleteConfirmDialog - Delete unexpected error:", error);
      toast({
        title: "删除失败",
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
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            您确定要删除成员 <strong>{individual?.full_name}</strong> 吗？
            此操作不可撤销，所有相关的关系记录也将被删除。
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

export default DeleteConfirmDialog;
