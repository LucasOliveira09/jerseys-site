import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import produtosData from '../data/produtos.json';
import { LIGAS_MENU } from '../utils/ligas';
import { Filter, AlertCircle } from 'lucide-react';

function LigaPage() {
  const { idLiga } = useParams(); // Ex: "la-liga"
  const [subFiltro, setSubFiltro] = useState('Todos');

  // 1. Descobre o nome "real" da liga baseado na URL
  // Ex: Se a URL é "la-liga", o nome no JSON deve ser "La Liga"
  const ligaInfo = LIGAS_MENU.find(l => l.id === idLiga);
  
  // Se não achar no menu, usa o próprio ID formatado (segurança)
  const nomeLigaNoJSON = ligaInfo ? ligaInfo.nome : idLiga;

  // 2. FILTRAGEM OFICIAL
  // Agora comparamos direto com o campo "liga" que está salvo no JSON
  const produtosDaLiga = produtosData.filter(produto => {
    // Verificação de segurança: normaliza strings para garantir
    return produto.liga === nomeLigaNoJSON;
  });

  // 3. Aplica o sub-filtro (Kids, Retro, etc) dentro dessa liga
  const produtosExibidos = subFiltro === 'Todos'
    ? produtosDaLiga
    : produtosDaLiga.filter(p => p.categoria === subFiltro);

  // Descobre quais categorias existem dentro dessa liga para criar os botões
  const categoriasDisponiveis = ['Todos', ...new Set(produtosDaLiga.map(p => p.categoria))];

  // Reseta o filtro se o usuário mudar de liga (clicar em outra no menu)
  useEffect(() => {
    setSubFiltro('Todos');
  }, [idLiga]);

  return (
    <div>
      {/* Cabeçalho da Liga */}
      <div className={`bg-white p-6 rounded-xl shadow-sm mb-6 border-l-8 ${ligaInfo ? 'border-black' : 'border-gray-300'}`}>
        <h1 className={`text-4xl font-bold uppercase tracking-tighter ${ligaInfo?.cor || 'text-black'}`}>
          {nomeLigaNoJSON}
        </h1>
        <p className="text-gray-500 mt-1">
          {produtosDaLiga.length} camisas encontradas
        </p>
      </div>

      {/* Barra de Filtros (Só aparece se tiver produtos) */}
      {produtosDaLiga.length > 0 ? (
        <>
          <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 text-gray-400 pr-2 border-r">
              <Filter size={18} />
              <span className="text-sm font-medium">Filtrar:</span>
            </div>
            {categoriasDisponiveis.map(cat => (
              <button
                key={cat}
                onClick={() => setSubFiltro(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                  subFiltro === cat 
                    ? 'bg-black text-white border-black shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Grid de Produtos */}
          {produtosExibidos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produtosExibidos.map(produto => (
                <Link to={`/produto/${produto.id}`} key={produto.id} className="group">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
                    
                    {/* Imagem */}
                    <div className="aspect-[3/4] overflow-hidden relative bg-gray-50">
                      <img 
                        src={produto.imagens.capa} 
                        alt={produto.nome} 
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      
                      {/* Tags Flutuantes */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {produto.categoria === 'Retro' && (
                          <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                            Lenda
                          </span>
                        )}
                        {produto.precos.promocional && (
                          <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                            Promo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-1.5 py-0.5 rounded">
                           {produto.categoria}
                         </p>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 leading-tight mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {produto.nome}
                      </h3>
                      
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        {produto.precos.promocional ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400 line-through">R$ {produto.precos.venda}</span>
                            <span className="text-lg font-black text-green-600">R$ {produto.precos.promocional}</span>
                          </div>
                        ) : (
                          <span className="text-lg font-black text-gray-900">R$ {produto.precos.venda}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Caso filtre por uma categoria vazia
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4"/>
              <p className="text-gray-500">Nenhum produto dessa categoria encontrado aqui.</p>
              <button onClick={() => setSubFiltro('Todos')} className="mt-4 text-blue-600 hover:underline">
                Limpar filtros
              </button>
            </div>
          )}
        </>
      ) : (
        // Caso a Liga não tenha NENHUM produto
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <Filter size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ainda sem produtos</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Não encontramos camisas cadastradas para <strong>{nomeLigaNoJSON}</strong> no momento.
          </p>
          <Link to="/" className="mt-6 px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition">
            Voltar para o Início
          </Link>
        </div>
      )}
    </div>
  );
}

export default LigaPage;