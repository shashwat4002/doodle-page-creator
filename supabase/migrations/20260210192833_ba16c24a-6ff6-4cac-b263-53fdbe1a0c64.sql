
-- 1. RBAC: user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Block direct insert"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block direct update"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Block direct delete"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-assign default role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- 2. PROFILE PRIVACY
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owner can view full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.get_public_profile(_profile_id uuid)
RETURNS TABLE (
  id uuid, full_name text, bio text, avatar_url text,
  research_interests text[], expertise_areas text[],
  institution text, email text,
  is_available_for_mentoring boolean, is_verified boolean,
  website_url text, twitter_url text, linkedin_url text,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.bio, p.avatar_url,
    p.research_interests, p.expertise_areas,
    CASE WHEN COALESCE(s.show_institution, true) THEN p.institution ELSE NULL END,
    CASE WHEN COALESCE(s.show_email, false) THEN p.email ELSE NULL END,
    p.is_available_for_mentoring, p.is_verified,
    p.website_url, p.twitter_url, p.linkedin_url, p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_settings s ON s.user_id = p.id
  WHERE p.id = _profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_public_profiles()
RETURNS TABLE (
  id uuid, full_name text, bio text, avatar_url text,
  research_interests text[], expertise_areas text[],
  institution text, is_available_for_mentoring boolean,
  is_verified boolean, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.bio, p.avatar_url,
    p.research_interests, p.expertise_areas,
    CASE WHEN COALESCE(s.show_institution, true) THEN p.institution ELSE NULL END,
    p.is_available_for_mentoring, p.is_verified, p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_settings s ON s.user_id = p.id
  WHERE COALESCE(s.profile_visibility, 'public') = 'public';
END;
$$;

-- 3. NOTIFICATION ANTI-SPAM
CREATE OR REPLACE FUNCTION public.create_notification_safe(
  _user_id uuid, _type notification_type, _title text,
  _message text DEFAULT NULL, _link text DEFAULT NULL,
  _related_project_id uuid DEFAULT NULL,
  _related_thread_id uuid DEFAULT NULL,
  _related_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
  _recent_count int;
  _duplicate_exists boolean;
  _prefs_ok boolean;
BEGIN
  SELECT COUNT(*) INTO _recent_count
  FROM public.notifications
  WHERE user_id = _user_id AND created_at > now() - interval '1 hour';
  IF _recent_count >= 30 THEN
    RAISE EXCEPTION 'Notification rate limit exceeded';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = _user_id AND type = _type AND title = _title
      AND COALESCE(related_project_id::text, '') = COALESCE(_related_project_id::text, '')
      AND COALESCE(related_user_id::text, '') = COALESCE(_related_user_id::text, '')
      AND created_at > now() - interval '5 minutes'
  ) INTO _duplicate_exists;
  IF _duplicate_exists THEN RETURN NULL; END IF;

  SELECT CASE _type
    WHEN 'match_request' THEN COALESCE(match_request_notifications, true)
    WHEN 'match_accepted' THEN COALESCE(match_request_notifications, true)
    WHEN 'match_rejected' THEN COALESCE(match_request_notifications, true)
    WHEN 'mentor_response' THEN COALESCE(mentor_response_notifications, true)
    WHEN 'feedback_received' THEN COALESCE(mentor_response_notifications, true)
    WHEN 'milestone_update' THEN COALESCE(milestone_notifications, true)
    WHEN 'community_reply' THEN COALESCE(community_notifications, true)
    ELSE true
  END INTO _prefs_ok
  FROM public.user_settings WHERE user_id = _user_id;
  IF _prefs_ok IS NULL THEN _prefs_ok := true; END IF;
  IF NOT _prefs_ok THEN RETURN NULL; END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link, related_project_id, related_thread_id, related_user_id)
  VALUES (_user_id, _type, _title, _message, _link, _related_project_id, _related_thread_id, _related_user_id)
  RETURNING id INTO _notification_id;
  RETURN _notification_id;
END;
$$;

-- 4. AUDIT LOG TABLE
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "No audit log modification"
  ON public.audit_logs FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No audit log deletion"
  ON public.audit_logs FOR DELETE TO authenticated USING (false);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 5. FIX ANNOUNCEMENTS RLS
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
