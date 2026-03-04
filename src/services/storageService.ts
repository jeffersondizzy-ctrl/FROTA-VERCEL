import { supabase } from './supabase';

const TABLES = {
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items',
  CHECKLISTS: 'checklists',
  NOTIFICATIONS: 'notifications',
};

export const storageService = {
  // --- SCALE GROUPS ---

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
    // If it has an ID, use partial update to avoid identity column issues
    if (group.id) {
      return this.updateScaleGroupPartial(group.id, group);
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

  async updateScaleGroupPartial(id: number, updates: any) {
    // CRITICAL: Remove 'id' from updates to prevent "cannot update identity column" error
    const { id: _, ...cleanUpdates } = updates;
    
    const { data, error } = await supabase
      .from(TABLES.GROUPS)
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating scale group partial:', error);
      throw error;
    }
    return data;
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

  // --- ESCALA ITEMS ---

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
      return this.updateEscalaItemPartial(item.id, item);
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

  async updateEscalaItemPartial(id: number, updates: any) {
    // CRITICAL: Remove 'id' from updates
    const { id: _, ...cleanUpdates } = updates;

    const { data, error } = await supabase
      .from(TABLES.ESCALA)
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating escala item partial:', error);
      throw error;
    }
    return data;
  },

  async saveEscalaItems(newItems: any[]) {
    // Ensure no IDs are sent for inserts if they are auto-generated
    const cleanItems = newItems.map(item => {
        const { id, ...rest } = item;
        return rest;
    });

    const { data, error } = await supabase
      .from(TABLES.ESCALA)
      .insert(cleanItems)
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

  // --- CHECKLISTS ---

  async getChecklists() {
    // Use 'veiculo_atrelado' as per user's earlier instruction that it's the real name
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .select('*')
      .order('veiculo_atrelado', { ascending: true });
    
    if (error) {
      console.error('Error fetching checklists:', error);
      return [];
    }
    // Map back to 'placa' for frontend compatibility if needed, 
    // but we'll update the frontend to use 'veiculo_atrelado'
    return data || [];
  },

  async saveChecklist(checklist: any) {
    // Remove 'id' if present to avoid identity column issues
    const { id, ...rest } = checklist;

    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .upsert(rest, { onConflict: 'veiculo_atrelado' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving checklist:', error);
      throw error;
    }
    return data;
  },

  async updateChecklistPartial(veiculo_atrelado: string, updates: any) {
    // Remove 'veiculo_atrelado' and 'id' from updates
    const { veiculo_atrelado: _, id: __, ...cleanUpdates } = updates;

    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .update(cleanUpdates)
      .eq('veiculo_atrelado', veiculo_atrelado)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating checklist partial:', error);
      throw error;
    }
    return data;
  },

  async deleteChecklist(veiculo_atrelado: string) {
    const { error } = await supabase
      .from(TABLES.CHECKLISTS)
      .delete()
      .eq('veiculo_atrelado', veiculo_atrelado);
    
    if (error) {
      console.error('Error deleting checklist:', error);
      throw error;
    }
  },

  // --- NOTIFICATIONS ---

  async getNotifications() {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  },

  async saveNotification(notification: any) {
    // Remove ID if it's auto-generated
    const { id, timestamp, ...rest } = notification;
    
    // Map timestamp to created_at if needed
    const payload = {
      ...rest,
      created_at: timestamp || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving notification:', error);
      return null;
    }
    return data;
  },

  async clearNotifications() {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .neq('id', '0'); // Delete all
    
    if (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }
};
