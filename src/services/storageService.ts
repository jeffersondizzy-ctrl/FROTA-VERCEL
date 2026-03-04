import { supabase } from './supabase';

const TABLES = {
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items',
  CHECKLISTS: 'checklists',
  NOTIFICATIONS: 'notifications',
};

// Helper to simulate async behavior if needed, but Supabase is already async
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const storageService = {
  async getScaleGroups() {
    const { data, error } = await supabase
      .from(TABLES.GROUPS)
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error fetching scale groups:', error);
      return [];
    }
    return data || [];
  },

  async saveScaleGroup(group: any) {
    // Remove any fields that might not be in the schema if necessary, 
    // but for now we assume the schema matches the object structure.
    // If group.id exists, update. Otherwise insert.
    
    if (group.id) {
      const { data, error } = await supabase
        .from(TABLES.GROUPS)
        .update(group)
        .eq('id', group.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating scale group:', error);
        throw error;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from(TABLES.GROUPS)
        .insert(group)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting scale group:', error);
        throw error;
      }
      return data;
    }
  },

  async deleteScaleGroup(id: number) {
    const { error } = await supabase
      .from(TABLES.GROUPS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting scale group:', error);
      throw error;
    }
  },

  async getEscalaItems() {
    const { data, error } = await supabase
      .from(TABLES.ESCALA)
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      console.error('Error fetching escala items:', error);
      return [];
    }
    return data || [];
  },

  async saveEscalaItem(item: any) {
    if (item.id) {
      const { data, error } = await supabase
        .from(TABLES.ESCALA)
        .update(item)
        .eq('id', item.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating escala item:', error);
        throw error;
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from(TABLES.ESCALA)
        .insert(item)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting escala item:', error);
        throw error;
      }
      return data;
    }
  },

  async saveEscalaItems(newItems: any[]) {
    // Supabase upsert can handle batch operations
    const { data, error } = await supabase
      .from(TABLES.ESCALA)
      .upsert(newItems, { onConflict: 'id' })
      .select();
    
    if (error) {
      console.error('Error saving escala items:', error);
      throw error;
    }
    return data;
  },

  async deleteEscalaItem(id: number) {
    const { error } = await supabase
      .from(TABLES.ESCALA)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting escala item:', error);
      throw error;
    }
  },

  async getChecklists() {
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .select('*')
      .order('placa', { ascending: true });
    
    if (error) {
      console.error('Error fetching checklists:', error);
      return [];
    }
    // Map back to flat structure if we stored as { placa, data: {...} }
    // But wait, if we store as JSONB in 'data' column, we need to merge 'placa' and 'data'.
    // Or we can just store everything in columns if we defined them.
    // In schema I defined 'placa' and 'data' (jsonb).
    // So we need to unwrap.
    return (data || []).map((row: any) => ({ ...row.data, placa: row.placa }));
  },

  async saveChecklist(checklist: any) {
    // We need to separate placa from the rest of the data
    const { placa, ...rest } = checklist;
    
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .upsert({ placa, data: rest }, { onConflict: 'placa' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving checklist:', error);
      throw error;
    }
    return { ...data.data, placa: data.placa };
  },

  async saveChecklists(newChecklists: any[]) {
    const rows = newChecklists.map(checklist => {
      const { placa, ...rest } = checklist;
      return { placa, data: rest };
    });

    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .upsert(rows, { onConflict: 'placa' })
      .select();
    
    if (error) {
      console.error('Error saving checklists:', error);
      throw error;
    }
    return (data || []).map((row: any) => ({ ...row.data, placa: row.placa }));
  },

  async deleteChecklist(placa: string) {
    const { error } = await supabase
      .from(TABLES.CHECKLISTS)
      .delete()
      .eq('placa', placa);
    
    if (error) {
      console.error('Error deleting checklist:', error);
      throw error;
    }
  },

  async getNotifications() {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  },

  async saveNotification(notification: any) {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert(notification)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving notification:', error);
      throw error;
    }
    return data;
  },

  async clearNotifications() {
    // Delete all notifications
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .neq('id', '0'); // Hack to delete all rows, assuming id is not '0' or just use a condition that is always true
      // Better: .delete().gt('timestamp', '1970-01-01')
    
    if (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }
};
