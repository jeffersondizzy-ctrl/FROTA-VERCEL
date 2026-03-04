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

  // --- CHECKLISTS ---

  async getChecklists() {
    // Use 'veiculo_atrelado' as the column name
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .select('*')
      .order('veiculo_atrelado', { ascending: true });
    
    if (error) {
      console.error('Error fetching checklists:', error);
      return [];
    }
    
    // Map 'veiculo_atrelado' to 'placa' for frontend compatibility
    return (data || []).map((row: any) => ({
      ...row,
      placa: row.veiculo_atrelado, 
      ...(typeof row.data === 'object' ? row.data : {})
    }));
  },

  async saveChecklist(checklist: any) {
    // Map 'placa' back to 'veiculo_atrelado'
    const { placa, veiculo_atrelado, id, ...rest } = checklist;
    const dbPayload = {
      veiculo_atrelado: placa || veiculo_atrelado,
      ...rest
    };

    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .upsert(dbPayload, { onConflict: 'veiculo_atrelado' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving checklist:', error);
      throw error;
    }
    return { ...data, placa: data.veiculo_atrelado };
  },

  async updateChecklistPartial(placa: string, updates: any) {
    // Remove 'placa'/'veiculo_atrelado' from updates to avoid PK update issues
    const { placa: _, veiculo_atrelado: __, ...cleanUpdates } = updates;

    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .update(cleanUpdates)
      .eq('veiculo_atrelado', placa)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating checklist partial:', error);
      throw error;
    }
    return { ...data, placa: data.veiculo_atrelado };
  },

  async deleteChecklist(placa: string) {
    const { error } = await supabase
      .from(TABLES.CHECKLISTS)
      .delete()
      .eq('veiculo_atrelado', placa);
    
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
