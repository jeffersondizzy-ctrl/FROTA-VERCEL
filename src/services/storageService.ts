import { supabase } from './supabase';

const TABLES = {
  CHECKLISTS: 'checklists',
  VEICULOS: 'veiculos',
  NOTIFICATIONS: 'notifications',
  GROUPS: 'scale_groups',
  ESCALA: 'escala_items'
};

export const storageService = {
  // --- BUSCAR LISTA (Resolve o "S/ DATA" e a Placa) ---
  async getChecklists() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHECKLISTS)
        .select('*, veiculos(placa)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        // Proteção: usa a placa do relacionamento ou um texto padrão (image_01708c)
        placa: item.veiculos?.placa || 'PLACA S/N',
        // Transforma data_vistoria em 'data' para o card reconhecer (image_01cec5)
        data: item.data_vistoria ? new Date(item.data_vistoria).toLocaleDateString('pt-BR') : 'S/ DATA'
      }));
    } catch (error) {
      console.error('Erro ao buscar:', error);
      return [];
    }
  },

  // --- SALVAR COM TRAVA DE DUPLICIDADE ---
  async saveChecklist(checklist: any) {
    try {
      const placaLimpa = checklist.placa?.toUpperCase().trim();
      if (!placaLimpa) throw new Error("Por favor, digite uma placa.");

      // 1. Busca o veículo
      let { data: veiculo } = await supabase
        .from(TABLES.VEICULOS)
        .select('id')
        .eq('placa', placaLimpa)
        .maybeSingle();

      // 2. Se o veículo já existe, verifica se já tem checklist HOJE
      if (veiculo) {
        const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { data: existente } = await supabase
          .from(TABLES.CHECKLISTS)
          .select('id')
          .eq('veiculo_id', veiculo.id)
          .gte('data_vistoria', `${hoje}T00:00:00Z`)
          .lte('data_vistoria', `${hoje}T23:59:59Z`)
          .maybeSingle();

        if (existente) {
          throw new Error(`A placa ${placaLimpa} já realizou checklist hoje!`);
        }
      } else {
        // Se a placa é nova, cadastra o veículo antes
        const { data: novoV, error: erroV } = await supabase
          .from(TABLES.VEICULOS)
          .insert([{ placa: placaLimpa, modelo: checklist.tipo || 'Padrão' }])
          .select().single();
        if (erroV) throw erroV;
        veiculo = novoV;
      }

      // 3. Salva a vistoria (Envia apenas o que a tabela checklists aceita)
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
      
      // Retorna o objeto pronto para o front-end não dar "tela azul"
      return { 
        ...data, 
        placa: data.veiculos?.placa || placaLimpa,
        data: new Date(data.data_vistoria).toLocaleDateString('pt-BR')
      };
    } catch (err: any) {
      alert(err.message); // Mostra o erro de placa repetida (image_015d87)
      throw err;
    }
  },

  // --- EXCLUIR VISTORIA ---
  async deleteChecklist(id: string | number) {
    const { error } = await supabase.from(TABLES.CHECKLISTS).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- OUTRAS FUNÇÕES (Escala e Notificações) ---
  async getScaleGroups() {
    const { data } = await supabase.from(TABLES.GROUPS).select('*').order('created_at', { ascending: false });
    return data || [];
  },
  async getEscalaItems() {
    const { data } = await supabase.from(TABLES.ESCALA).select('*').order('id', { ascending: false });
    return data || [];
  },
  async getNotifications() {
    const { data } = await supabase.from(TABLES.NOTIFICATIONS).select('*').order('timestamp', { ascending: false }).limit(50);
    return data || [];
  }
};