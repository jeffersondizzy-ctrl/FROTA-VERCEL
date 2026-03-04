import { supabase } from './supabase';

const TABLES = {
  CHECKLISTS: 'checklists',
  VEICULOS: 'veiculos',
  NOTIFICATIONS: 'notifications',
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items'
};

export const storageService = {
  // --- SCALE GROUPS ---
  async getScaleGroups() {
    const { data, error } = await supabase.from(TABLES.GROUPS).select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching scale groups:', error); return []; }
    return data || [];
  },

  async saveScaleGroup(group: any) {
    const { id, created_at, ...rest } = group;
    const { data, error } = await supabase.from(TABLES.GROUPS).insert(rest).select().single();
    if (error) throw error;
    return data;
  },

  async updateScaleGroupPartial(id: number | string, updates: any) {
    const { id: _, created_at: __, ...cleanUpdates } = updates;
    const { data, error } = await supabase.from(TABLES.GROUPS).update(cleanUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteScaleGroup(id: number | string) {
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
    const { id, created_at, ...rest } = item;
    const { data, error } = await supabase.from(TABLES.ESCALA).insert(rest).select().single();
    if (error) throw error;
    return data;
  },

  async updateEscalaItemPartial(id: number | string, updates: any) {
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

  async deleteEscalaItem(id: number | string) {
    const { error } = await supabase.from(TABLES.ESCALA).delete().eq('id', id);
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
  },

  // --- CHECKLISTS (BUSCAR LISTA ATUALIZADO) ---
  async getChecklists() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .select(`
          *,
          veiculos (
            placa
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        placa: item.veiculos?.placa || 'PLACA S/N',
        // Mapeia data_vistoria para 'data' para sumir o "S/ DATA" nos cards (image_01708c)
        data: item.data_vistoria 
      }));
    } catch (error) {
      console.error('Erro ao buscar vistorias:', error);
      return [];
    }
  },

  // --- SALVAR COM PROIBIÇÃO DE DUPLICIDADE NO DIA ---
  async saveChecklist(checklist: any) {
    try {
      const placaLimpa = checklist.placa?.toUpperCase().trim();
      
      // Define o intervalo de hoje (00:00:00 até 23:59:59)
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      // 1. Busca ou cria o veículo
      let { data: veiculo } = await supabase
        .from(TABLES.VEICULOS)
        .select('id')
        .eq('placa', placaLimpa)
        .maybeSingle();

      if (veiculo) {
        // VERIFICAÇÃO DE DUPLICIDADE: Busca checklist para este veículo HOJE
        const { data: existente } = await supabase
          .from(TABLES.CHECKLISTS)
          .select('id')
          .eq('veiculo_id', veiculo.id)
          .gte('data_vistoria', hojeInicio.toISOString())
          .lte('data_vistoria', hojeFim.toISOString())
          .maybeSingle();

        if (existente) {
          // Lança erro para impedir salvamento (image_023ec0)
          throw new Error(`A placa ${placaLimpa} já realizou checklist hoje!`);
        }
      } else {
        // Cria veículo novo se não existir
        const { data: novoV, error: erroV } = await supabase
          .from(TABLES.VEICULOS)
          .insert([{ placa: placaLimpa, modelo: checklist.tipo || 'Padrão' }])
          .select().single();
        if (erroV) throw erroV;
        veiculo = novoV;
      }

      // 2. Salva a vistoria
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .insert([{
          veiculo_id: veiculo.id,
          status: 'Realizada',
          observacoes: checklist.observacoes || '',
          data_vistoria: new Date().toISOString()
        }])
        .select('*, veiculos(placa)')
        .single();

      if (error) throw error;
      
      // Retorna objeto mapeado para atualizar a lista instantaneamente
      return { 
        ...data, 
        placa: data.veiculos?.placa,
        data: data.data_vistoria 
      };
    } catch (err: any) {
      alert(err.message); // Alerta o usuário sobre a placa repetida (image_023ec0)
      console.error('Erro ao salvar:', err.message);
      throw err;
    }
  },

  async deleteChecklist(id: string | number) {
    const { error } = await supabase
      .from(TABLES.CHECKLISTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};