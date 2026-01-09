import React, { useState } from 'react';
import produtosData from '../data/produtos.json'; // Importa seu JSON
import { Link } from 'react-router-dom';

function Home() {
  const [filtro, setFiltro] = useState('Todos');

  // Pega todas as categorias únicas do seu JSON para criar os botões
  const categorias = ['Todos', ...new Set(produtosData.map(p => p.categoria))];

  // Filtra os produtos
  const produtosExibidos = filtro === 'Todos' 
    ? produtosData 
    : produtosData.filter(p => p.categoria === filtro);

  return (
    <div>
      {/* Banner Promocional */}
      <div className="bg-gray-900 text-white p-8 rounded-xl mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">As Melhores Camisas do Mundo</h1>
        <p className="text-gray-400">Qualidade de jogador, preço de torcedor.</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {categorias.map(cat => (
          <button 
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              filtro === cat ? 'bg-black text-white' : 'bg-white text-black border'
            }`}
          >
            {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {produtosExibidos.map(produto => (
          <Link to={`/produto/${produto.id}`} key={produto.id} className="group">
            <div className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              
              {/* Imagem (Capa do JSON) */}
              <div className="aspect-[3/4] overflow-hidden relative">
                <img 
                  src={produto.imagens.capa} 
                  alt={produto.nome} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {produto.precos.promocional && (
                   <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                     OFERTA
                   </span>
                )}
              </div>

              {/* Informações */}
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase">{produto.categoria}</p>
                <h3 className="font-semibold text-gray-900 truncate">{produto.nome}</h3>
                
                <div className="mt-2 flex items-baseline gap-2">
                  {produto.precos.promocional ? (
                    <>
                      <span className="text-lg font-bold text-green-600">R$ {produto.precos.promocional}</span>
                      <span className="text-sm text-gray-400 line-through">R$ {produto.precos.venda}</span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">R$ {produto.precos.venda}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;