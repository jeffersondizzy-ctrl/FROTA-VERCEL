import { supabase } from './supabase';

export const storageService = {
  async saveChecklist(checklist: any) {
    try {
      // 1. Buscar o ID do veículo pela placa (O banco exige UUID, não texto)
      const { data: vData } = await supabase
        .from('veiculos')
        .select('id')
        .eq('placa', checklist.placa?.toUpperCase())
        .maybeSingle();

      if (!vData) throw new Error("Placa não cadastrada no sistema.");

      // 2. MONTAGEM MANUAL (Não enviamos o objeto 'checklist' inteiro)
      // Isso impede que campos como 'tipo' ou 'tipo_veiculo' cheguem ao banco
      const payload = {
        veiculo_id: vData.id, // O ID real do banco (cite: image_032748)
        status: checklist.status || 'Realizada',
        observacoes: checklist.observacoes || '',
        data_vistoria: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('checklists')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error("Erro fatal ao salvar:", err.message);
      throw err;
    }
  },

  async getChecklists() {
    // Busca checklists e traz a placa da tabela relacionada 'veiculos'
    const { data, error } = await supabase
      .from('checklists')
      .select('*, veiculos(placa)') 
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao carregar:", error.message);
      return [];
    }
    return data || [];
  }
};