import { supabase } from './supabase';

export const storageService = {
  // ESCALAS E DOCAS (Correção Erro 428C9)
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

  // CHECKLISTS (Ajustado ao seu banco: image_032748.png)
  async saveChecklist(checklist: any) {
    const { id, ...rest } = checklist;
    // Seu banco usa 'veiculo_id' e 'status' (image_032748.png)
    const { data, error } = await supabase
      .from('checklists')
      .insert([rest]) 
      .select();
    if (error) throw error;
    return data;
  },

  // NOTIFICAÇÕES (Usa 'timestamp' em vez de 'created_at': image_032748.png)
  async getNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('timestamp', { ascending: false });
    return data || [];
  }
};