import { supabase } from './supabase';

const TABLES = {
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items',
  CHECKLISTS: 'checklists',
  NOTIFICATIONS: 'notifications',
};

export const storageService = {
  // --- ESCALAS (RESOLVE ERRO 428C9) ---
  async updateScaleGroupPartial(id: number, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase
      .from(TABLES.GROUPS)
      .update(cleanUpdates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  async deleteScaleGroup(id: number) {
    const { error } = await supabase.from(TABLES.GROUPS).delete().eq('id', id);
    if (error) throw error;
  },

  // --- DOCAS E ITENS (RESOLVE ERRO 428C9) ---
  async updateEscalaItemPartial(id: number, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase
      .from(TABLES.ESCALA)
      .update(cleanUpdates)
      .eq('id', id);
    if (error) throw error;
    return data;
  },

  // --- CHECKLISTS (NOMES DE COLUNAS CORRIGIDOS CONFORME SCHEMA) ---
  async getChecklists() {
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .select('*, veiculos(place)') // Faz um join para pegar a placa se precisar
      .order('created_at', { ascending: false });
    return data || [];
  },

  async saveChecklist(checklist: any) {
    // Ajustando os campos para o que existe no seu banco (image_032748.png)
    const dataToSave = {
      veiculo_id: checklist.veiculo_id, // Use o UUID do veículo
      status: checklist.status || 'Pendente',
      observacoes: checklist.observacoes || '',
      data_vistoria: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .insert([dataToSave])
      .select();
    if (error) throw error;
    return data;
  },

  // --- NOTIFICAÇÕES (USANDO TIMESTAMP) ---
  async getNotifications() {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .order('timestamp', { ascending: false }); // Seu banco usa timestamp (image_032748.png)
    return data || [];
  }
};