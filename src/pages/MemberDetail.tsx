import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Plus, TreePine, User, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import EditMemberDialog from "@/components/EditMemberDialog";
import AddRelationshipDialog from "@/components/AddRelationshipDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

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

interface Relationship {
  id: number;
  person1_id: number;
  person2_id: number;
  type: string;
  person1?: Individual;
  person2?: Individual;
}

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [individual, setIndividual] = useState<Individual | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddRelationshipDialog, setShowAddRelationshipDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIndividual();
      fetchRelationships();
    }
  }, [id]);

  const fetchIndividual = async () => {
    try {
      const { data, error } = await supabase
        .from("Individual")
        .select("*")
        .eq("id", parseInt(id!))
        .single();

      if (error) {
        toast({
          title: "获取信息失败",
          description: error.message,
          variant: "destructive"
        });
        navigate("/dashboard");
      } else {
        setIndividual(data);
      }
    } catch (error) {
      toast({
        title: "获取信息失败",
        description: "发生未知错误",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  };

  const fetchRelationships = async () => {
    try {
      // First get all relationships involving this person
      const { data: relationshipData, error: relationshipError } = await supabase
        .from("Relationship")
        .select("*")
        .or(`person1_id.eq.${parseInt(id!)},person2_id.eq.${parseInt(id!)}`);

      if (relationshipError) {
        toast({
          title: "获取关系失败",
          description: relationshipError.message,
          variant: "destructive"
        });
        return;
      }

      // Get all unique person IDs we need to fetch
      const personIds = new Set<number>();
      relationshipData?.forEach(rel => {
        personIds.add(rel.person1_id);
        personIds.add(rel.person2_id);
      });

      // Fetch all individuals involved in relationships
      const { data: individualsData, error: individualsError } = await supabase
        .from("Individual")
        .select("*")
        .in("id", Array.from(personIds));

      if (individualsError) {
        toast({
          title: "获取个人信息失败",
          description: individualsError.message,
          variant: "destructive"
        });
        return;
      }

      // Create a map for quick lookup
      const individualsMap = new Map<number, Individual>();
      individualsData?.forEach(person => {
        individualsMap.set(person.id, person);
      });

      // Combine relationship data with individual data
      const enrichedRelationships: Relationship[] = relationshipData?.map(rel => ({
        ...rel,
        person1: individualsMap.get(rel.person1_id),
        person2: individualsMap.get(rel.person2_id)
      })) || [];

      setRelationships(enrichedRelationships);
    } catch (error) {
      toast({
        title: "获取关系失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getRelationshipLabel = (relationship: Relationship, currentPersonId: number) => {
    if (relationship.type === 'parent') {
      if (relationship.person1_id === currentPersonId) {
        return '父母';
      } else {
        return '子女';
      }
    } else if (relationship.type === 'spouse') {
      return '配偶';
    }
    return relationship.type;
  };

  const getRelatedPerson = (relationship: Relationship, currentPersonId: number) => {
    if (relationship.person1_id === currentPersonId) {
      return relationship.person2;
    } else {
      return relationship.person1;
    }
  };

  const handleDeleteSuccess = () => {
    // Navigate back to dashboard after successful deletion
    navigate("/dashboard");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  if (!individual) {
    return <div className="flex items-center justify-center min-h-screen">未找到该成员</div>;
  }

  // 分类关系
  const parents = relationships.filter(r => 
    r.type === 'parent' && r.person2_id === individual.id
  );
  const children = relationships.filter(r => 
    r.type === 'parent' && r.person1_id === individual.id
  );
  const spouses = relationships.filter(r => 
    r.type === 'spouse' && (r.person1_id === individual.id || r.person2_id === individual.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <div className="flex items-center space-x-2">
                <TreePine className="h-8 w-8 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">成员详情</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑信息
              </Button>
              {isAdmin && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除成员
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 基本信息 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{individual.full_name}</CardTitle>
                  <Badge variant={individual.gender === '男' ? 'default' : 'secondary'}>
                    {individual.gender}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700">性别</h4>
                    <p>{individual.gender}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">出生日期</h4>
                    <p>{formatDate(individual.birth_date)}</p>
                  </div>
                  {individual.death_date && (
                    <div>
                      <h4 className="font-medium text-gray-700">逝世日期</h4>
                      <p>{formatDate(individual.death_date)}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-700">出生地</h4>
                    <p>{individual.birth_place}</p>
                  </div>
                  {individual.residence && (
                    <div>
                      <h4 className="font-medium text-gray-700">居住地</h4>
                      <p>{individual.residence}</p>
                    </div>
                  )}
                </div>
                
                {individual.biography && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">生平简介</h4>
                      <p className="text-gray-600 leading-relaxed">{individual.biography}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 照片区域 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>照片</CardTitle>
              </CardHeader>
              <CardContent>
                {individual.photo_path ? (
                  <img
                    src={individual.photo_path}
                    alt={individual.full_name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 家族关系 */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">家族关系</h2>
            <Button onClick={() => setShowAddRelationshipDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加关系
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 父母 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">父母</CardTitle>
              </CardHeader>
              <CardContent>
                {parents.length === 0 ? (
                  <p className="text-gray-500">暂无父母信息</p>
                ) : (
                  <div className="space-y-2">
                    {parents.map((relationship) => {
                      const parent = getRelatedPerson(relationship, individual.id);
                      return (
                        <div key={relationship.id} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{parent?.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {parent?.birth_date && formatDate(parent.birth_date)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 配偶 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">配偶</CardTitle>
              </CardHeader>
              <CardContent>
                {spouses.length === 0 ? (
                  <p className="text-gray-500">暂无配偶信息</p>
                ) : (
                  <div className="space-y-2">
                    {spouses.map((relationship) => {
                      const spouse = getRelatedPerson(relationship, individual.id);
                      return (
                        <div key={relationship.id} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{spouse?.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {spouse?.birth_date && formatDate(spouse.birth_date)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 子女 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">子女</CardTitle>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <p className="text-gray-500">暂无子女信息</p>
                ) : (
                  <div className="space-y-2">
                    {children.map((relationship) => {
                      const child = getRelatedPerson(relationship, individual.id);
                      return (
                        <div key={relationship.id} className="p-2 bg-gray-50 rounded">
                          <p className="font-medium">{child?.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {child?.birth_date && formatDate(child.birth_date)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 对话框 */}
      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        individual={individual}
        onSuccess={() => {
          fetchIndividual();
          fetchRelationships();
        }}
      />

      <AddRelationshipDialog
        open={showAddRelationshipDialog}
        onOpenChange={setShowAddRelationshipDialog}
        currentIndividual={individual}
        onSuccess={fetchRelationships}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        individual={individual}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default MemberDetail;
