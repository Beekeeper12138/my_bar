
-- 第一步：为现有的4个用户批量创建管理员权限的profile记录
INSERT INTO public.profiles (id, role, updated_at)
SELECT id, 'ADMIN', now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 第二步：修改handle_new_user函数，将默认角色改为ADMIN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'ADMIN');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
