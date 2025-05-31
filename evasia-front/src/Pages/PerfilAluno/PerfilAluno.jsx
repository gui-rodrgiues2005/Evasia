import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PerfilHeader from '../../Components/compomentesPerfilAluno/PerfilHeader/PerfilHeader';
import MetricasAluno from '../../Components/compomentesPerfilAluno/MetricaAluno/MetricaAluno';
import ResumoStatus from '../../Components/compomentesPerfilAluno/ResumoStatus/ResumoStatus';
import HistoricoAtividades from '../../Components/compomentesPerfilAluno/HistoricoAtividades/HistoricoAtividades';
import EvolucaoAluno from '../../Components/compomentesPerfilAluno/EvolucaoAluno/EvolucaoAluno';
import AnaliseTendencia from '../../Components/compomentesPerfilAluno/AnaliseTendencia/AnaliseTendencia';

const PerfilAluno = () => {
    const { user_id } = useParams();

    useEffect(() => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id,
        action: "check_dropout_risk"
      })
    })
      .then(res => res.json())
      .then(data => console.log("Análise de evasão iniciada:", data))
      .catch(err => console.error("Erro ao enviar dados para o webhook:", err));
  }, [user_id]);

  return (
    <div className="perfil-container" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/alunos" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
          ← Voltar para a lista de alunos
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Coluna da Esquerda */}
        <div style={{ flex: 2 }}>
          <PerfilHeader />
          <MetricasAluno />
          <ResumoStatus />
          <HistoricoAtividades />
        </div>

        {/* Coluna da Direita */}
        <div style={{ flex: 1 }}>
          <EvolucaoAluno />
          <AnaliseTendencia />
        </div>
      </div>
    </div>
  );
};

export default PerfilAluno;
