import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Heart, Lock, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";
import DeleteRelationshipDialog from "@/components/DeleteRelationshipDialog";

interface Individual {
  id: number;
  full_name: string;
  gender: string;
  birth_date: string;
  birth_place: string;
  death_date: string | null;
  residence: string | null;
  biography: string | null;
  photo_path: string | null;
  created_at: string;
}

interface Relationship {
  id: number;
  person1_id: number;
  person2_id: number;
  type: string;
  created_at: string;
}

interface RelationshipWithNames extends Relationship {
  person1_name: string;
  person2_name: string;
  person1_gender: string;
  person2_gender: string;
}

const Relationships = () => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [relationships, setRelationships] = useState<RelationshipWithNames[]>([]);
  const [person1Id, setPerson1Id] = useState<string>("");
  const [person2Id, setPerson2Id] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipWithNames | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log("Relationships - Fetching data...");
      // Fetch individuals
      const { data: individualsData, error: individualsError } = await supabase
        .from("Individual")
        .select("*")
        .order("full_name");

      if (individualsError) {
        console.error("Relationships - Individuals fetch error:", individualsError);
        toast({
          title: "获取个人数据失败",
          description: individualsError.message,
          variant: "destructive"
        });
        return;
      }

      console.log("Relationships - Individuals data:", individualsData);
      setIndividuals(individualsData || []);

      // Fetch relationships
      await fetchRelationships(individualsData || []);

    } catch (error) {
      console.error("Relationships - Unexpected error:", error);
      toast({
        title: "获取数据失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async (individualsData: Individual[]) => {
    try {
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from("Relationship")
        .select("*")
        .order("created_at", { ascending: false });

      if (relationshipsError) {
        console.error("Relationships - Relationships fetch error:", relationshipsError);
        toast({
          title: "获取关系数据失败",
          description: relationshipsError.message,
          variant: "destructive"
        });
        return;
      }

      // Map relationship data with person names and genders
      const relationshipsWithNames: RelationshipWithNames[] = (relationshipsData || []).map(rel => {
        const person1 = individualsData.find(p => p.id === rel.person1_id);
        const person2 = individualsData.find(p => p.id === rel.person2_id);
        
        console.log(`Relationship mapping - Person1: ${person1?.full_name} (${person1?.gender}), Person2: ${person2?.full_name} (${person2?.gender})`);
        
        return {
          ...rel,
          person1_name: person1?.full_name || "未知",
          person2_name: person2?.full_name || "未知",
          person1_gender: person1?.gender || "",
          person2_gender: person2?.gender || ""
        };
      });

      console.log("Relationships - Fetch successful");
      setRelationships(relationshipsWithNames);
    } catch (error) {
      console.error("Error fetching relationships:", error);
    }
  };

  const getGenderDisplay = (gender: string) => {
    console.log(`getGenderDisplay called with: "${gender}" (type: ${typeof gender})`);
    // 数据库中存储的是中文性别
    if (gender === '男') {
      return '男';
    } else if (gender === '女') {
      return '女';
    } else {
      console.warn(`Unknown gender value: "${gender}"`);
      return gender; // 返回原始值以便调试
    }
  };

  const validateRelationship = (person1Id: number, person2Id: number, type: string): string | null => {
    // Cannot have relationship with self
    if (person1Id === person2Id) {
      return "一个人不能与自己建立关系";
    }

    // For parent relationship, validate birth dates
    if (type === "parent") {
      const parent = individuals.find(p => p.id === person1Id);
      const child = individuals.find(p => p.id === person2Id);
      
      if (parent && child) {
        const parentBirthDate = new Date(parent.birth_date);
        const childBirthDate = new Date(child.birth_date);
        
        if (parentBirthDate >= childBirthDate) {
          return "父母的出生日期必须早于子女的出生日期";
        }
      }
    }

    // Check for duplicate relationships
    const existingRelationship = relationships.find(rel => 
      (rel.person1_id === person1Id && rel.person2_id === person2Id && rel.type === type) ||
      (rel.person1_id === person2Id && rel.person2_id === person1Id && rel.type === type)
    );

    if (existingRelationship) {
      return "该关系已存在";
    }

    return null;
  };

  const handleSaveRelationship = async () => {
    if (!isAdmin) {
      toast({
        title: "权限不足",
        description: "只有管理员可以添加家族关系",
        variant: "destructive"
      });
      return;
    }

    if (!person1Id || !person2Id || !relationshipType) {
      toast({
        title: "请填写完整信息",
        description: "请选择两个人员和关系类型",
        variant: "destructive"
      });
      return;
    }

    const person1IdNum = parseInt(person1Id);
    const person2IdNum = parseInt(person2Id);

    // Validate relationship
    const validationError = validateRelationship(person1IdNum, person2IdNum, relationshipType);
    if (validationError) {
      toast({
        title: "关系验证失败",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      console.log("Relationships - Creating relationship:", { person1IdNum, person2IdNum, relationshipType });
      const { error } = await supabase
        .from("Relationship")
        .insert({
          person1_id: person1IdNum,
          person2_id: person2IdNum,
          type: relationshipType
        });

      if (error) {
        console.error("Relationships - Create error:", error);
        toast({
          title: "保存关系失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Relationships - Create successful");
        // Log relationship creation
        await logAuditEvent(AUDIT_ACTIONS.CREATE_RELATIONSHIP, {
          person1_id: person1IdNum,
          person2_id: person2IdNum,
          type: relationshipType
        });
        
        toast({
          title: "关系保存成功",
          description: "新的关系已成功建立"
        });
        
        // Clear form
        setPerson1Id("");
        setPerson2Id("");
        setRelationshipType("");
        
        // Refresh relationships
        await fetchRelationships(individuals);
      }
    } catch (error) {
      console.error("Relationships - Create unexpected error:", error);
      toast({
        title: "保存关系失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelationship = (relationship: RelationshipWithNames) => {
    setSelectedRelationship(relationship);
    setShowDeleteDialog(true);
  };

  const getRelationshipDescription = (rel: RelationshipWithNames) => {
    console.log(`getRelationshipDescription - Type: ${rel.type}, Person1: ${rel.person1_name} (gender: "${rel.person1_gender}"), Person2: ${rel.person2_name} (gender: "${rel.person2_gender}")`);
    
    if (rel.type === "parent") {
      // 检查person1的性别来确定是父亲还是母亲
      if (rel.person1_gender === '男') {
        return `${rel.person1_name} 是 ${rel.person2_name} 的父亲`;
      } else if (rel.person1_gender === '女') {
        return `${rel.person1_name} 是 ${rel.person2_name} 的母亲`;
      } else {
        console.warn(`Unknown parent gender: "${rel.person1_gender}"`);
        return `${rel.person1_name} 是 ${rel.person2_name} 的父母`;
      }
    } else if (rel.type === "spouse") {
      // 更明确的性别判断逻辑
      console.log(`Spouse relationship - Person1 gender: "${rel.person1_gender}" (is male: ${rel.person1_gender === '男'}), Person2 gender: "${rel.person2_gender}" (is female: ${rel.person2_gender === '女'})`);
      
      if (rel.person1_gender === '男' && rel.person2_gender === '女') {
        console.log("Case: Male to Female - returning husband");
        return `${rel.person1_name} 是 ${rel.person2_name} 的丈夫`;
      } else if (rel.person1_gender === '女' && rel.person2_gender === '男') {
        console.log("Case: Female to Male - returning wife");
        return `${rel.person1_name} 是 ${rel.person2_name} 的妻子`;
      } else {
        console.log(`Case: Other - Person1: "${rel.person1_gender}", Person2: "${rel.person2_gender}" - returning generic spouse`);
        return `${rel.person1_name} 与 ${rel.person2_name} 是配偶关系`;
      }
    }
    return `${rel.person1_name} 与 ${rel.person2_name} 的关系: ${rel.type}`;
  };

  const handleRefresh = () => {
    console.log("Relationships - Refreshing data...");
    logAuditEvent('REFRESH_DATA', { page: 'relationships' });
    fetchData();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">关系管理</h1>
          <p className="text-gray-600">建立和管理家族成员之间的关系</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧: 建立关系表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>建立新关系</span>
                {!isAdmin && <Lock className="h-4 w-4 text-gray-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAdmin && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">只有管理员可以添加家族关系</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择第一个人
                </label>
                <Select 
                  value={person1Id} 
                  onValueChange={setPerson1Id}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isAdmin ? "选择第一个人" : "需要管理员权限"} />
                  </SelectTrigger>
                  <SelectContent>
                    {individuals.map(person => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.full_name} ({person.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关系类型
                </label>
                <Select 
                  value={relationshipType} 
                  onValueChange={setRelationshipType}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isAdmin ? "选择关系类型" : "需要管理员权限"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">父母关系 (第一个人是父母)</SelectItem>
                    <SelectItem value="spouse">配偶关系</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择第二个人
                </label>
                <Select 
                  value={person2Id} 
                  onValueChange={setPerson2Id}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isAdmin ? "选择第二个人" : "需要管理员权限"} />
                  </SelectTrigger>
                  <SelectContent>
                    {individuals.map(person => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.full_name} ({person.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleSaveRelationship} 
                  disabled={saving || !person1Id || !person2Id || !relationshipType || !isAdmin}
                  className="flex-1"
                  variant={isAdmin ? "default" : "secondary"}
                >
                  {isAdmin ? (
                    saving ? "保存中..." : "保存关系"
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      保存关系
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧: 现有关系列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>现有关系 ({relationships.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relationships.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>关系描述</TableHead>
                      <TableHead>建立时间</TableHead>
                      <TableHead className="w-16">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relationships.map((rel) => (
                      <TableRow key={rel.id}>
                        <TableCell>{getRelationshipDescription(rel)}</TableCell>
                        <TableCell>
                          {new Date(rel.created_at).toLocaleDateString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRelationship(rel)}
                            disabled={!isAdmin}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无已建立的关系
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteRelationshipDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        relationship={selectedRelationship}
        onSuccess={() => fetchRelationships(individuals)}
      />
    </div>
  );
};

export default Relationships;
