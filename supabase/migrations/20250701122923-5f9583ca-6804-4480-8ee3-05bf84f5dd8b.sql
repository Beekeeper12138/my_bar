
-- 检查当前的 profiles 表 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 检查是否有允许用户自己更新角色的策略
-- 如果没有，我们需要添加一个临时策略来允许用户更新自己的角色
CREATE POLICY "Users can update their own role" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);
