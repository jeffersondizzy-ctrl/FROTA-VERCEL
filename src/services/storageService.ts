import { supabase } from './supabase';

const TABLES = {
  CHECKLISTS: 'checklists',
  VEICULOS: 'veiculos',
  NOTIFICATIONS: 'notifications'
};

export const storageService = {
  // --- BUSCAR LISTA DE VISTORIAS (Para exibir na aba Checklist) ---
  async getChecklists() {
    const { data, error } = await supabase
      .from(TABLES.CHECKLISTS)
      .select(`
        *,
        veiculos (
          placa
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar vistorias:', error.message);
      return [];
    }
    return data || [];
  },

  // --- SALVAR VISTORIA COM PLACA MANUAL ---
  async saveChecklist(checklist: any) {
    try {
      const placaFormatada = checklist.placa?.toUpperCase().trim();

      // 1. Verifica se o veículo já existe no cadastro
      let { data: veiculo } = await supabase
        .from(TABLES.VEICULOS)
        .select('id')
        .eq('placa', placaFormatada)
        .maybeSingle();

      // 2. Se a placa for nova, cadastra o veículo automaticamente (Auto-cadastro)
      if (!veiculo) {
        const { data: novoVeiculo, error: vError } = await supabase
          .from(TABLES.VEICULOS)
          .insert([{ 
            placa: placaFormatada, 
            modelo: checklist.tipo || 'Não informado' 
          }])
          .select()
          .single();

        if (vError) throw vError;
        veiculo = novoVeiculo;
      }

      // 3. Salva a vistoria vinculada ao ID do veículo (UUID)
      // Removemos campos extras para evitar erro PGRST204 (image_02bae0)
      const payload = {
        veiculo_id: veiculo.id,
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
      console.error('Falha ao salvar:', err.message);
      throw err;
    }
  },

  // --- EXCLUIR VISTORIA ---
  async deleteChecklist(id: string | number) {
    const { error } = await supabase
      .from(TABLES.CHECKLISTS)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar:', error.message);
      throw error;
    }
    return true;
  },

  // --- NOTIFICAÇÕES (Mapeado corretamente) ---
  async getNotifications() {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('*')
      .order('timestamp', { ascending: false });
    return data || [];
  }
};