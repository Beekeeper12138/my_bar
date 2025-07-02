
-- 首先删除有问题的RLS策略
DROP POLICY IF EXISTS "Users can view all profiles if admin" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- 创建一个安全定义器函数来获取当前用户角色，避免递归
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 重新创建不会造成递归的RLS策略
CREATE POLICY "Users can view all profiles if admin" ON public.profiles 
  FOR SELECT USING (
    auth.uid() = id OR public.get_current_user_role() = 'ADMIN'
  );

CREATE POLICY "Admins can update profiles" ON public.profiles 
  FOR UPDATE USING (
    public.get_current_user_role() = 'ADMIN'
  );
