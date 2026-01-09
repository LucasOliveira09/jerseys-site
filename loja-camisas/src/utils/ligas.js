// src/utils/ligas.js

// Apenas a configuração do MENU e o link entre URL e o Nome no JSON
export const LIGAS_MENU = [
  { id: 'premier-league', nome: 'Premier League', cor: 'text-purple-600' },
  { id: 'brasileirao',    nome: 'Brasileirão',    cor: 'text-green-600' },
  { id: 'la-liga',        nome: 'La Liga',        cor: 'text-orange-600' },
  { id: 'serie-a',        nome: 'Serie A',        cor: 'text-blue-600' },
  { id: 'ligue-1',        nome: 'Ligue 1',        cor: 'text-yellow-500' },
  { id: 'bundesliga',     nome: 'Bundesliga',     cor: 'text-red-700' },
  { id: 'portugal',       nome: 'Portugal',       cor: 'text-red-600' },
  { id: 'selecoes',       nome: 'Seleções',       cor: 'text-blue-400' },
];

// O script do backend pode ter salvo como "Outros" se não achou a liga
// Vamos tratar isso na página