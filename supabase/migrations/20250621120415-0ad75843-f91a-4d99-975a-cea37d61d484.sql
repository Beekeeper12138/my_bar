
-- 创建个人信息表
CREATE TABLE public.Individual (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('男', '女')),
  birth_date DATE NOT NULL,
  death_date DATE,
  birth_place TEXT NOT NULL,
  residence TEXT,
  biography TEXT,
  photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_death_date CHECK (death_date IS NULL OR death_date >= birth_date)
);

-- 创建家族分支表
CREATE TABLE public.FamilyBranch (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  origin_location TEXT,
  ancestral_hall TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建关系表
CREATE TABLE public.Relationship (
  id BIGSERIAL PRIMARY KEY,
  person1_id BIGINT NOT NULL REFERENCES public.Individual(id) ON DELETE CASCADE,
  person2_id BIGINT NOT NULL REFERENCES public.Individual(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parent', 'spouse')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_persons CHECK (person1_id != person2_id),
  CONSTRAINT unique_relationship UNIQUE(person1_id, person2_id, type)
);

-- 创建事件表
CREATE TABLE public.Event (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建个人事件关联表
CREATE TABLE public.IndividualEvent (
  individual_id BIGINT NOT NULL REFERENCES public.Individual(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES public.Event(id) ON DELETE CASCADE,
  PRIMARY KEY (individual_id, event_id)
);

-- 创建家族事件关联表
CREATE TABLE public.FamilyEvent (
  family_id BIGINT NOT NULL REFERENCES public.FamilyBranch(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES public.Event(id) ON DELETE CASCADE,
  PRIMARY KEY (family_id, event_id)
);

-- 创建验证parent关系的触发器函数
CREATE OR REPLACE FUNCTION validate_parent_relationship()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'parent' THEN
    -- 验证person1的出生日期必须早于person2的出生日期
    IF (SELECT birth_date FROM public.Individual WHERE id = NEW.person1_id) >= 
       (SELECT birth_date FROM public.Individual WHERE id = NEW.person2_id) THEN
      RAISE EXCEPTION '父母的出生日期必须早于子女的出生日期';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER validate_parent_relationship_trigger
  BEFORE INSERT OR UPDATE ON public.Relationship
  FOR EACH ROW
  EXECUTE FUNCTION validate_parent_relationship();

-- 创建索引以提高查询性能
CREATE INDEX idx_relationship_person1 ON public.Relationship(person1_id);
CREATE INDEX idx_relationship_person2 ON public.Relationship(person2_id);
CREATE INDEX idx_relationship_type ON public.Relationship(type);
CREATE INDEX idx_individual_name ON public.Individual(full_name);
CREATE INDEX idx_individual_birth_date ON public.Individual(birth_date);
CREATE INDEX idx_event_date ON public.Event(date);

-- 创建复合索引用于关系查询优化
CREATE INDEX idx_relationship_person1_type ON public.Relationship(person1_id, type);
CREATE INDEX idx_relationship_person2_type ON public.Relationship(person2_id, type);
