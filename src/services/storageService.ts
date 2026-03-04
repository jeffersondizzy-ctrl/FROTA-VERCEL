import { supabase } from './supabase';

const TABLES = {
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items',
  CHECKLISTS: 'checklists',
  NOTIFICATIONS: 'notifications',
};

export const storageService = {
  // --- FUNÇÃO MESTRE PARA EVITAR ERRO DE ID (428C9) ---
  async updatePartial(table: string, id: any, updates: any, idColumn = 'id') {
    const { id: _, ...cleanUpdates } = updates; // Remove o ID do corpo da atualização
    const { data, error } = await supabase
      .from(table)
      .update(cleanUpdates)
      .eq(idColumn, id)
      .select();
    if (error) throw error;
    return data;
  },

  // --- ESCALAS (Arquivar e Excluir) ---
  async getScaleGroups() {
    const { data, error } = await supabase.from(TABLES.GROUPS).select('*');
    return data || [];
  },

  async deleteScaleGroup(id: number) {
    const { error } = await supabase.from(TABLES.GROUPS).delete().eq('id', id);
    if (error) throw error;
  },

  // --- CHECKLISTS (Onde está o erro de "placa" e "tipo") ---
  async getChecklists() {
    // Busca simples sem filtros que quebram o app
    const { data, error } = await supabase.from(TABLES.CHECKLISTS).select('*');
    if (error) return [];
    return data || [];
  },

  async saveChecklist(checklist: any) {
    // Removemos campos que podem não existir para testar o salvamento básico
    const { id, created_at, ...basicData } = checklist;
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .insert([basicData])
      .select();
    if (error) {
      console.error("Erro real do banco:", error.message);
      throw error;
    }
    return data;
  }
};