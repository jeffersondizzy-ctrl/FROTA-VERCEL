import { supabase } from './supabase';

const TABLES = {
  CHECKLISTS: 'checklists',
  VEICULOS: 'veiculos',
  NOTIFICATIONS: 'notifications',
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items'
};

export const storageService = {
  // --- BUSCAR LISTA (CORREÇÃO PARA O "S/ DATA") ---
  async getChecklists() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .select('*, veiculos(placa)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      return (data || []).map(item => {
        // Tenta converter a data do banco para o formato brasileiro
        let dataExibicao = 'S/ DATA';
        const rawDate = item.data_vistoria || item.created_at;
        
        if (rawDate) {
          dataExibicao = new Date(rawDate).toLocaleDateString('pt-BR');
        }

        return {
          ...item,
          placa: item.veiculos?.placa || 'PLACA S/N',
          // O seu componente procura por 'data', então entregamos 'data' formatada
          data: dataExibicao 
        };
      });
    } catch (error) {
      console.error('Erro ao buscar vistorias:', error);
      return [];
    }
  },

  // --- SALVAR COM BLOQUEIO DE DUPLICIDADE ---
  async saveChecklist(checklist: any) {
    try {
      const placaLimpa = checklist.placa?.toUpperCase().trim();
      
      // Define hoje (Brasília) para a trava
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // 1. Busca veículo
      let { data: veiculo } = await supabase
        .from(TABLES.VEICULOS)
        .select('id')
        .eq('placa', placaLimpa)
        .maybeSingle();

      if (veiculo) {
        // VERIFICA DUPLICIDADE NO DIA (image_015d87)
        const { data: existente } = await supabase
          .from(TABLES.CHECKLISTS)
          .select('id')
          .eq('veiculo_id', veiculo.id)
          .gte('data_vistoria', hoje.toISOString())
          .lt('data_vistoria', amanha.toISOString())
          .maybeSingle();

        if (existente) {
          throw new Error(`A placa ${placaLimpa} já realizou checklist hoje!`);
        }
      } else {
        // Cria veículo novo
        const { data: novoV, error: erroV } = await supabase
          .from(TABLES.VEICULOS)
          .insert([{ placa: placaLimpa, modelo: checklist.tipo || 'Padrão' }])
          .select().single();
        if (erroV) throw erroV;
        veiculo = novoV;
      }

      // 2. SALVA VISTORIA (Limpa colunas inexistentes para evitar erro PGRST204)
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
      
      return { 
        ...data, 
        placa: data.veiculos?.placa,
        data: new Date(data.data_vistoria).toLocaleDateString('pt-BR')
      };
    } catch (err: any) {
      // Exibe o erro de trava no console e no alerta (image_015d87)
      console.error('Erro no salvamento:', err.message);
      alert(err.message); 
      throw err;
    }
  },

  // --- OUTRAS FUNÇÕES (Mantidas conforme seu arquivo anterior) ---
  async deleteChecklist(id: string | number) {
    const { error } = await supabase.from(TABLES.CHECKLISTS).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getScaleGroups() {
    const { data, error } = await supabase.from(TABLES.GROUPS).select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async getEscalaItems() {
    const { data, error } = await supabase.from(TABLES.ESCALA).select('*').order('id', { ascending: false });
    return data || [];
  },

  async getNotifications() {
    const { data, error } = await supabase.from(TABLES.NOTIFICATIONS).select('*').order('timestamp', { ascending: false }).limit(50);
    return data || [];
  }
};