import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import './App.scss';

import Dashboard from './Pages/Dashboard/Dashboard';
import Alunos from './Pages/Alunos/Alunos';
import PerfilAluno from './Pages/PerfilAluno/PerfilAluno';
import Alertas from './Pages/AlertasEvasao/AlertaEvasao';
import Relatorios from './Pages/Relatorios/Relatorios';
import logo from './assets/logo.svg';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <aside className="sidebar">
          <div className="sidebar__logo">
            <img src={logo} alt="Logo Evasia" />
          </div>
          <nav className="sidebar__nav">
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/alunos">Alunos</Link></li>
              <li><Link to="/alertas">Converse com a IA</Link></li>
              <li><Link to="/relatorios">Relatórios</Link></li>
            </ul>
          </nav>
        </aside>

        {/* A parte principal do conteúdo será renderizada aqui */}
        <main style={{ flex: 1, padding: '1rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/perfil-aluno/:user_id" element={<PerfilAluno />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
