import { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './App.scss';

import Dashboard from './Pages/Dashboard/Dashboard';
import Alunos from './Pages/Alunos/Alunos';
import PerfilAluno from './Pages/PerfilAluno/PerfilAluno';
import ChatIA from './Pages/Chat_IA/Chat_IA';
import Relatorios from './Pages/Relatorios/Relatorios';
// import logo from './assets/logo.svg';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="app-container">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Sidebar com condicional de classe */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar__logo">
            {/* <img src={logo} alt="Logo Evasia" /> */}
          </div>
          <nav className="sidebar__nav">
            <ul>
              <li><Link to="/" onClick={() => setSidebarOpen(false)}>Dashboard</Link></li>
              <li><Link to="/alunos" onClick={() => setSidebarOpen(false)}>Monitoramento Estudantil</Link></li>
              <li><Link to="/chat-ai/:user_id" onClick={() => setSidebarOpen(false)}>Converse com a IA</Link></li>
              <li><Link to="/relatorios" onClick={() => setSidebarOpen(false)}>Relatórios</Link></li>
            </ul>
          </nav>
        </aside>

        {/* Conteúdo principal com margem dinâmica */}
        <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/perfil-aluno/:user_id" element={<PerfilAluno />} />
            <Route path="/chat-ai/:user_id" element={<ChatIA />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;