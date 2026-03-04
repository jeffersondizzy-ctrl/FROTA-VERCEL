import { supabase } from './supabase';

export const storageService = {
  // --- ESCALAS E DOCAS ---
  // Remove ID e campos protegidos para evitar o erro 428C9
  async updateEscalaItemPartial(id: number, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase
      .from('escala_items')
      .update(cleanUpdates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  async deleteScaleGroup(id: number) {
    const { error } = await supabase.from('scale_groups').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CHECKLISTS (VISTORIAS) ---
  // Ajustado para usar 'veiculo_id' conforme seu banco real (image_032748.png)
  async saveChecklist(checklist: any) {
    const { id, created_at, ...rest } = checklist;
    const { data, error } = await supabase
      .from('checklists')
      .insert([rest]) 
      .select();
    if (error) throw error;
    return data;
  },

  async getChecklists() {
    const { data, error } = await supabase
      .from('checklists')
      .select('*, veiculos(place)')
      .order('created_at', { ascending: false });
    return data || [];
  },

  // --- NOTIFICAÇÕES ---
  // Usa 'timestamp' em vez de 'created_at' conforme image_032748.png
  async getNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('timestamp', { ascending: false });
    return data || [];
  }
};