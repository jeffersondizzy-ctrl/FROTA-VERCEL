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
    const { data, error } = await supabase.from(TABLES.GROUPS).select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching scale groups:', error); return []; }
    return data || [];
  },

  async saveScaleGroup(group: any) {
    if (group.id) return this.updateScaleGroupPartial(group.id, group);
    const { data, error } = await supabase.from(TABLES.GROUPS).insert(group).select().single();
    if (error) throw error;
    return data;
  },

  async updateScaleGroupPartial(id: number, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase.from(TABLES.GROUPS).update(cleanUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteScaleGroup(id: number) {
    const { error } = await supabase.from(TABLES.GROUPS).delete().eq('id', id);
    if (error) throw error;
  },

  // --- ESCALA ITEMS ---
  async getEscalaItems() {
    const { data, error } = await supabase.from(TABLES.ESCALA).select('*').order('id', { ascending: false });
    if (error) { console.error('Error fetching escala items:', error); return []; }
    return data || [];
  },

  async saveEscalaItem(item: any) {
    if (item.id) return this.updateEscalaItemPartial(item.id, item);
    const { data, error } = await supabase.from(TABLES.ESCALA).insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async updateEscalaItemPartial(id: number, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase.from(TABLES.ESCALA).update(cleanUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async saveEscalaItems(newItems: any[]) {
    const cleanItems = newItems.map(item => { const { id, created_at, ...rest } = item; return rest; });
    const { data, error } = await supabase.from(TABLES.ESCALA).insert(cleanItems).select();
    if (error) throw error;
    return data;
  },

  async deleteEscalaItem(id: number) {
    const { error } = await supabase.from(TABLES.ESCALA).delete().eq('id', id);
    if (error) throw error;
  },

  // --- CHECKLISTS ---
  async getChecklists() {
    // Restaurado! Impede o erro de "is not a function"
    const { data, error } = await supabase.from(TABLES.CHECKLISTS).select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching checklists:', error); return []; }
    return data || [];
  },

  async saveChecklist(checklist: any) {
    try {
      if (checklist.id) return await this.updateChecklistPartial(checklist.id, checklist);
      
      const { id, created_at, ...rest } = checklist; 
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .insert([rest])
        .select()
        .single();
        
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      return data;
    } catch (err) {
      console.error('saveChecklist error:', err);
      throw err;
    }
  },

  async updateChecklistPartial(id: number | string, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase.from(TABLES.CHECKLISTS).update(cleanUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteChecklist(id: number | string) {
    const { error } = await supabase.from(TABLES.CHECKLISTS).delete().eq('id', id);
    if (error) throw error;
  },

  // --- NOTIFICATIONS ---
  async getNotifications() {
    const { data, error } = await supabase.from(TABLES.NOTIFICATIONS).select('*').order('timestamp', { ascending: false }).limit(50);
    if (error) { console.error('Error fetching notifications:', error); return []; }
    return data || [];
  },

  async saveNotification(notification: any) {
    const { id, created_at, ...rest } = notification;
    const { data, error } = await supabase.from(TABLES.NOTIFICATIONS).insert(rest).select().single();
    if (error) return null;
    return data;
  },

  async clearNotifications() {
    const { error } = await supabase.from(TABLES.NOTIFICATIONS).delete().neq('id', '0');
    if (error) throw error;
  }
};