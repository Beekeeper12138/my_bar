
import { supabase } from '@/integrations/supabase/client';

export const logAuditEvent = async (action: string, details?: any) => {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_details: details || null
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// Common audit actions
export const AUDIT_ACTIONS = {
  CREATE_INDIVIDUAL: 'CREATE_INDIVIDUAL',
  UPDATE_INDIVIDUAL: 'UPDATE_INDIVIDUAL',
  DELETE_INDIVIDUAL: 'DELETE_INDIVIDUAL',
  VIEW_INDIVIDUAL: 'VIEW_INDIVIDUAL',
  CREATE_RELATIONSHIP: 'CREATE_RELATIONSHIP',
  DELETE_RELATIONSHIP: 'DELETE_RELATIONSHIP',
  CREATE_EVENT: 'CREATE_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  ROLE_CHANGE: 'ROLE_CHANGE',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  GENERATE_FAMILY_TREE: 'GENERATE_FAMILY_TREE',
  VIEW_TREE_NODE: 'VIEW_TREE_NODE',
  FILTER_FAMILY_TREE: 'FILTER_FAMILY_TREE',
  REFRESH_DATA: 'REFRESH_DATA',
  VIEW_PAGE: 'VIEW_PAGE'
} as const;
