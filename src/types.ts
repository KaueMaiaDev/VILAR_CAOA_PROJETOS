export interface Responsavel {
  id: string;
  nome: string;
  cargo: string;
  area: string;
  email: string;
  telefone: string;
}

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  solicitante: string;
  dataRecebimento: string;
  prioridade: 'Baixa' | 'Media' | 'Alta' | 'Critica';
  status: 'Nova' | 'Em analise' | 'Aprovada' | 'Rejeitada' | 'Transformada em Projeto';
  projetoCriadoId?: string; // Links demand to created project
}

export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  area: string;
  dataInicio: string;
  dataPrevistaConclusao: string;
  prioridade: 'Baixa' | 'Media' | 'Alta' | 'Critica';
  status: 'Planejamento' | 'Em andamento' | 'Pausado' | 'Concluido';
}

export interface Atividade {
  id: string;
  projetoId: string;
  nome: string;
  descricao: string;
  responsavelId: string; // Foreing key to Responsavel
  dataInicio: string;
  dataLimite: string;
  prioridade: 'Baixa' | 'Media' | 'Alta' | 'Critica';
  status: 'Pendente' | 'Em andamento' | 'Pausado' | 'Em validacao' | 'Concluido' | 'Cancelado';
}

export interface Comentario {
  id: string;
  atividadeId: string;
  autor: string;
  texto: string;
  data: string;
}

export interface Anexo {
  id: string;
  atividadeId: string;
  nomeArquivo: string;
  tipo: 'PDF' | 'DOCX' | 'XLSX' | 'PNG' | 'JPG' | 'Outro';
  tamanho: string; // Ex: "1.2 MB"
  dadosBase64?: string; // Simulated file saving index or dummy base64
  dataAnexo: string;
}

export interface HistoricoAtividade {
  id: string;
  atividadeId: string;
  descricao: string; // Ex: "Status alterado para Em andamento"
  data: string;
}

export interface DashboardMetrics {
  totalProjetos: number;
  projetosAtivos: number;
  projetosPausados: number;
  projetosConcluidos: number;
  totalAtividades: number;
  atividadesPendentes: number;
  atividadesEmAndamento: number;
  atividadesConcluidas: number;
  atividadesAtrasadas: number;
}
