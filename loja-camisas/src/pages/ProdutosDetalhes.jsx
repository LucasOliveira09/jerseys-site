import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import produtosData from '../data/produtos.json';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

function ProdutoDetalhes() {
  const { id } = useParams();
  const produto = produtosData.find(p => p.id === id);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');

  if (!produto) {
    return <div className="text-center mt-20">Produto não encontrado. <Link to="/">Voltar</Link></div>;
  }

  // Se seu JSON não tiver a lista de tamanhos salva dentro do objeto produto,
  // usamos um padrão. O ideal é que o script anterior já tenha salvo isso.
  const tamanhos = produto.opcoes?.tamanhos || ['P', 'M', 'G', 'GG', 'XG'];

  return (
    <div className="max-w-6xl mx-auto mt-6 bg-white p-6 rounded-xl shadow-lg">
      <Link to="/" className="flex items-center text-gray-500 mb-6 hover:text-black">
        <ArrowLeft size={20} className="mr-2"/> Voltar para loja
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Galeria de Imagens */}
        <div className="grid gap-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={produto.imagens.capa} alt={produto.nome} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {produto.imagens.galeria.slice(0, 4).map((img, index) => (
              <img key={index} src={img} className="rounded-lg cursor-pointer hover:opacity-75 border" />
            ))}
          </div>
        </div>

        {/* Info do Produto */}
        <div>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            {produto.categoria}
          </span>
          <h1 className="text-3xl font-bold mt-4 mb-2">{produto.nome}</h1>
          
          <div className="text-3xl mb-6">
             {produto.precos.promocional ? (
                <div className="flex gap-3 items-center">
                   <span className="font-bold text-green-600">R$ {produto.precos.promocional}</span>
                   <span className="text-xl text-gray-400 line-through">R$ {produto.precos.venda}</span>
                </div>
             ) : (
                <span className="font-bold">R$ {produto.precos.venda}</span>
             )}
          </div>

          {/* Seleção de Tamanho */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3">Escolha o tamanho:</h3>
            <div className="flex gap-3">
              {tamanhos.map(tamanho => (
                <button
                  key={tamanho}
                  onClick={() => setTamanhoSelecionado(tamanho)}
                  className={`w-12 h-12 rounded-lg border-2 font-bold flex items-center justify-center transition-all ${
                    tamanhoSelecionado === tamanho 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {tamanho}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Comprar */}
          <button 
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!tamanhoSelecionado}
            onClick={() => alert(`Adicionado ao carrinho: ${produto.nome} - Tamanho ${tamanhoSelecionado}`)}
          >
            <ShoppingCart />
            {tamanhoSelecionado ? 'Adicionar ao Carrinho' : 'Selecione um Tamanho'}
          </button>
          
          <div className="mt-8 text-sm text-gray-500 space-y-2">
             <p>✅ Produto Oficial Importado</p>
             <p>🚚 Frete Grátis para todo o Brasil</p>
             <p>💳 Parcelamento em até 12x</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProdutoDetalhes;