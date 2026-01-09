import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ProdutoDetalhes from './pages/ProdutoDetalhes';
import { ShoppingBag } from 'lucide-react'; // Ícone do carrinho

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* --- NAVBAR (Cabeçalho) --- */}
        <nav className="bg-black text-white p-4 shadow-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold uppercase tracking-wider">
              FutStore
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/" className="hover:text-yellow-400">Início</Link>
              <Link to="/categoria/retro" className="hover:text-yellow-400">Retrô</Link>
              <div className="relative cursor-pointer hover:text-yellow-400">
                <ShoppingBag size={24} />
                <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">0</span>
              </div>
            </div>
          </div>
        </nav>

        {/* --- CONTEÚDO DAS PÁGINAS --- */}
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produto/:id" element={<ProdutoDetalhes />} />
            {/* Adicionaremos mais rotas depois */}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;