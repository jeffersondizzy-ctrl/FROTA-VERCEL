import { supabase } from './supabase';

const TABLES = {
  CHECKLISTS: 'checklists',
  VEICULOS: 'veiculos',
  NOTIFICATIONS: 'notifications'
};

export const storageService = {
  // --- BUSCAR LISTA (CORRIGIDO PARA APARECER A PLACA) ---
  async getChecklists() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .select(`
          *,
          veiculos (
            placa
          )
        `) // Esta parte busca a placa na outra tabela
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Mapeia os dados para que o componente front-end encontre a 'placa' facilmente
      return (data || []).map(item => ({
        ...item,
        placa: item.veiculos?.placa || 'PLACA S/N'
      }));
    } catch (error) {
      console.error('Erro ao buscar vistorias:', error);
      return [];
    }
  },

  // --- SALVAR VISTORIA COM AUTO-CADASTRO DE VEÍCULO ---
  async saveChecklist(checklist: any) {
    try {
      const placaLimpa = checklist.placa?.toUpperCase().trim();

      // 1. Busca ou cria o veículo
      let { data: veiculo } = await supabase
        .from(TABLES.VEICULOS)
        .select('id')
        .eq('placa', placaLimpa)
        .maybeSingle();

      if (!veiculo) {
        const { data: novoV, error: erroV } = await supabase
          .from(TABLES.VEICULOS)
          .insert([{ placa: placaLimpa, modelo: checklist.tipo }])
          .select().single();
        if (erroV) throw erroV;
        veiculo = novoV;
      }

      // 2. Salva a vistoria (usando apenas colunas que existem no banco)
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .insert([{
          veiculo_id: veiculo.id,
          status: 'Realizada',
          observacoes: checklist.observacoes || '',
          data_vistoria: new Date().toISOString()
        }])
        .select('*, veiculos(placa)') // Já retorna com a placa para atualizar a tela
        .single();

      if (error) throw error;
      return { ...data, placa: data.veiculos?.placa };
    } catch (err: any) {
      console.error('Erro ao salvar:', err.message);
      throw err;
    }
  },

  // --- EXCLUIR VISTORIA ---
  async deleteChecklist(id: string | number) {
    const { error } = await supabase
      .from(TABLES.CHECKLISTS)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};