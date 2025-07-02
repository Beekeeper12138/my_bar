
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

// Match the actual database schema
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

const Branches = () => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [familyNames, setFamilyNames] = useState<string[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [filteredMembers, setFilteredMembers] = useState<Individual[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIndividuals();
  }, []);

  const fetchIndividuals = async () => {
    try {
      console.log("Branches - Fetching individuals...");
      const { data, error } = await supabase
        .from("Individual")
        .select("*")
        .order("full_name");

      if (error) {
        console.error("Branches - Fetch error:", error);
        toast({
          title: "获取数据失败",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Branches - Fetch successful:", data?.length);
        setIndividuals(data || []);
        
        // Extract unique family names from full_name (first character)
        const families = new Set<string>();
        data?.forEach(person => {
          if (person.full_name) {
            const familyName = person.full_name.charAt(0);
            families.add(familyName);
          }
        });
        
        const sortedFamilies = Array.from(families).sort();
        setFamilyNames(sortedFamilies);
        
        // Select first family by default
        if (sortedFamilies.length > 0) {
          setSelectedFamily(sortedFamilies[0]);
          filterMembersByFamily(sortedFamilies[0], data || []);
        }
      }
    } catch (error) {
      console.error("Branches - Unexpected error:", error);
      toast({
        title: "获取数据失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMembersByFamily = (familyName: string, membersList: Individual[] = individuals) => {
    const filtered = membersList.filter(person => 
      person.full_name && person.full_name.startsWith(familyName)
    );
    setFilteredMembers(filtered);
    
    // Log family filter action
    logAuditEvent('VIEW_FAMILY_BRANCH', {
      family_name: familyName,
      member_count: filtered.length
    });
  };

  const handleFamilySelect = (familyName: string) => {
    setSelectedFamily(familyName);
    filterMembersByFamily(familyName);
  };

  const handleMemberClick = (memberId: number) => {
    // Log member view action
    logAuditEvent('VIEW_INDIVIDUAL', { individual_id: memberId });
    navigate(`/member/${memberId}`);
  };

  const handleRefresh = () => {
    console.log("Branches - Refreshing data...");
    logAuditEvent('REFRESH_DATA', { page: 'branches' });
    fetchIndividuals();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">家族分支浏览器</h1>
          <p className="text-gray-600">按姓氏浏览家族成员</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧家族列表 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>家族姓氏</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {familyNames.map((familyName) => (
                    <Button
                      key={familyName}
                      variant={selectedFamily === familyName ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleFamilySelect(familyName)}
                    >
                      {familyName}氏
                      <span className="ml-auto text-sm text-gray-500">
                        {individuals.filter(p => p.full_name?.startsWith(familyName)).length}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧成员列表 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedFamily}氏家族成员 ({filteredMembers.length}人)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredMembers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>性别</TableHead>
                        <TableHead>出生日期</TableHead>
                        <TableHead>出生地</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow 
                          key={member.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleMemberClick(member.id)}
                        >
                          <TableCell className="font-medium">{member.full_name}</TableCell>
                          <TableCell>{member.gender === 'male' ? '男' : '女'}</TableCell>
                          <TableCell>
                            {member.birth_date ? new Date(member.birth_date).toLocaleDateString('zh-CN') : '-'}
                          </TableCell>
                          <TableCell>{member.birth_place || '-'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMemberClick(member.id);
                              }}
                            >
                              查看详情
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    暂无{selectedFamily}氏家族成员
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Branches;
