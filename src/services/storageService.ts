import { supabase } from './supabase';

const TABLES = {
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items',
  CHECKLISTS: 'checklists',
  NOTIFICATIONS: 'notifications',
  VEICULOS: 'veiculos'
};

export const storageService = {
  // --- AUXILIAR: BUSCAR ID DO VEÍCULO PELA PLACA ---
  async getVeiculoByPlaca(placa: string) {
    const { data, error } = await supabase
      .from(TABLES.VEICULOS)
      .select('id')
      .eq('placa', placa.toUpperCase())
      .single();
    
    if (error) return null;
    return data?.id;
  },

  // --- CHECKLISTS (CORRIGIDO PARA SALVAR DE VERDADE) ---
  async getChecklists() {
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .select(`
        *,
        veiculos (placa)
      `)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async saveChecklist(checklist: any) {
    try {
      // 1. Tenta descobrir o UUID do veículo usando a placa digitada
      let vId = checklist.veiculo_id;
      if (!vId && checklist.placa) {
        vId = await this.getVeiculoByPlaca(checklist.placa);
      }

      if (!vId) {
        throw new Error("Veículo não encontrado com esta placa.");
      }

      // 2. Monta o objeto EXATAMENTE como o banco quer (conforme image_032748)
      const payload = {
        veiculo_id: vId,
        status: checklist.status || 'Realizada',
        observacoes: checklist.observacoes || '',
        data_vistoria: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err.message);
      throw err;
    }
  },

  // --- ESCALA ITEMS (MANTIDO) ---
  async getEscalaItems() {
    const { data, error } = await supabase.from(TABLES.ESCALA).select('*').order('id', { ascending: false });
    return data || [];
  },

  async saveEscalaItem(item: any) {
    const { id, created_at, ...rest } = item;
    const { data, error } = await supabase.from(TABLES.ESCALA).insert(rest).select().single();
    if (error) throw error;
    return data;
  },

  // --- NOTIFICATIONS (CORRIGIDO PARA NOMES REAIS DAS COLUNAS) ---
  async getNotifications() {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .order('timestamp', { ascending: false }); // image_032748 confirma que é 'timestamp'
    if (error) return [];
    return data || [];
  },

  async saveNotification(notification: any) {
    const { id, created_at, ...rest } = notification;
    const { data, error } = await supabase.from(TABLES.NOTIFICATIONS).insert(rest).select().single();
    return data;
  }
};