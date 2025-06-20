import React, { useState } from 'react';
// Importe axios se ainda usa para outras chamadas, caso contrário pode remover
// Se 'axios' não for mais usado em NENHUMA PARTE deste arquivo, você pode remover a linha abaixo.
// No entanto, para evitar quebrar outras partes do seu projeto que possam usá-lo, vamos mantê-lo por enquanto.
import axios from 'axios'; 

const alunos = [
  { nome: 'João Silva', frequencia: 45, media: 5.2, risco: 'Moderado' },
  { nome: 'João Silva', frequencia: 45, media: 5.2, risco: 'Moderado' },
];

const AlertaEvasao = () => {
  // === NOVO ESTADO PARA A FUNCIONALIDADE DE CONVERSA COM A IA ===
  const [studentId, setStudentId] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // URL do Webhook de TESTE do n8n - VOCÊ DEVE OBTER ESTA URL DA SUA INSTÂNCIA DO N8N
  // Lembre-se de usar a URL de PRODUÇÃO quando o fluxo estiver ativo no n8n.
  const N8N_WEBHOOK_URL = 'https://lucasdev55.app.n8n.cloud/webhook-test/77bde499-67c0-4418-a761-6df8d479dd7a'; // Ex: 'https://your-n8n.cloud/webhook-test/77bde499-67c0-4418-a761-6df8d479dd7a'

  const handleAnalyzeStudent = async () => {
    if (!studentId) {
      alert('Por favor, insira o ID do aluno.');
      return;
    }
    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      console.log(`[Frontend] Enviando user_id ${studentId} para Webhook n8n: ${N8N_WEBHOOK_URL}`);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: studentId }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json(); // Pega a resposta JSON da IA diretamente
      setAiResponse(data);
      console.log("[Frontend] Resposta da IA recebida diretamente do n8n:", data);

    } catch (err) {
      console.error("[Frontend] Erro ao acionar IA ou obter resposta:", err);
      setError(`Erro ao processar a solicitação: ${err.message}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };
  // === FIM DO NOVO ESTADO E LÓGICA ===

  return (
    <div style={{ padding: '24px' }}>
      {/* Conteúdo da Tabela de Alertas de Evasão Existente */}
      <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>
        ⚠️ Alertas de Evasão
      </h2>
      <p style={{ marginBottom: '24px' }}>
        Alunos identificados com riscos moderado ou alto de evasão.
      </p>

      <table style={tableStyle}>
        <thead style={{ background: '#f9f9f9' }}>
          <tr>
            <th style={thStyle}>Aluno</th>
            <th style={thStyle}>Frequência</th>
            <th style={thStyle}>Média</th>
            <th style={thStyle}>Nível de Risco</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>{aluno.nome}</td>
              <td style={tdStyle}>
                <div style={{ width: '100px', background: '#ddd', borderRadius: '4px', overflow: 'hidden', height: '10px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: `${aluno.frequencia}%`,
                      backgroundColor: '#d4a600',
                      height: '100%'
                    }}
                  />
                </div>
                <span>{aluno.frequencia}%</span>
              </td>
              <td style={tdStyle}>{aluno.media}</td>
              <td style={tdStyle}>
                <span style={{
                  backgroundColor: '#000',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {aluno.risco}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* === NOVA SEÇÃO: Converse com a IA === */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Converse com a IA</h2>
        <p style={{ marginBottom: '24px' }}>
          Obtenha análises de evasão detalhadas para um estudante específico.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
          <label htmlFor="studentId" style={{ fontWeight: 'bold' }}>ID do Aluno:</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Ex: 12345"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flexGrow: 1, maxWidth: '200px' }}
          />
          <button 
            onClick={handleAnalyzeStudent} 
            disabled={loading}
            style={{
                padding: '10px 15px',
                backgroundColor: '#007bff', // Cor azul para o botão
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Analisando...' : 'Analisar Evasão'}
          </button>
        </div>

        {loading && <p style={{ color: '#007bff' }}>A IA está analisando os dados. Isso pode levar alguns segundos...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {aiResponse && (
          <div style={{ 
              backgroundColor: '#f0f8ff', // Um azul claro para o box de resposta
              border: '1px solid #cceeff', 
              borderRadius: '8px', 
              padding: '20px', 
              marginTop: '20px' 
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Análise da IA para {aiResponse.student_name || 'o aluno'}</h3>
            {/* Você pode renderizar o JSON completo para depuração, ou campos específicos */}
            {/* <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#e9f5ff', padding: '10px', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {JSON.stringify(aiResponse, null, 2)}
            </pre> */}
            
            <p><strong>ID do Estudante:</strong> {aiResponse.user_id}</p>
            <p><strong>Nome:</strong> {aiResponse.student_name}</p>
            <p><strong>Curso:</strong> {aiResponse.course_info}</p>
            <p><strong>Último Acesso:</strong> {aiResponse.last_access_analysis?.last_access_date} ({aiResponse.last_access_analysis?.days_since_access} dias atrás, {aiResponse.last_access_analysis?.access_frequency})</p>
            <p><strong>Progresso no Curso:</strong> {aiResponse.academic_status?.course_progress}</p>
            <p><strong>Média Atual:</strong> {aiResponse.academic_status?.current_grades}</p>
            <p><strong>Status das Atividades:</strong> {aiResponse.academic_status?.assignments_status}</p>

            <h4 style={{ marginTop: '15px', marginBottom: '5px', color: '#555' }}>Nível de Risco: <span style={{ 
                backgroundColor: aiResponse.risk_assessment?.risk_level === 'ALTO' ? '#dc3545' : 
                                   aiResponse.risk_assessment?.risk_level === 'MÉDIO' ? '#ffc107' : '#28a745',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
            }}>{aiResponse.risk_assessment?.risk_level}</span></h4>
            <p><strong>Score de Risco:</strong> {aiResponse.risk_assessment?.risk_score}</p>
            <p><strong>Confiança da Análise:</strong> {aiResponse.risk_assessment?.confidence}%</p>
            <p><strong>Fatores de Risco Primários:</strong> {aiResponse.risk_assessment?.primary_risk_factors?.join(', ') || 'Nenhum'}</p>
            <p><strong>Fatores Protetivos:</strong> {aiResponse.risk_assessment?.protective_factors?.join(', ') || 'Nenhum'}</p>

            <h4 style={{ marginTop: '15px', marginBottom: '5px', color: '#555' }}>Recomendações:</h4>
            <p><strong>Ações Imediatas:</strong> {aiResponse.recommendations?.immediate_actions?.join(', ') || 'Nenhuma'}</p>
            <p><strong>Ações de Acompanhamento:</strong> {aiResponse.recommendations?.follow_up_actions?.join(', ') || 'Nenhuma'}</p>
            <p><strong>Prioridade de Contato:</strong> {aiResponse.recommendations?.contact_priority}</p>

            <p style={{ fontSize: '12px', color: '#888', marginTop: '20px' }}>
                Analisado em: {aiResponse.analysis_metadata?.analyzed_at} por {aiResponse.analysis_metadata?.analyst}
            </p>
          </div>
        )}
      </div>
      {/* === FIM DA NOVA SEÇÃO === */}
    </div>
  );
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: '40px' // Adiciona margem abaixo da tabela
};

const thStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '1px solid #ddd'
};

const tdStyle = {
  padding: '12px',
  textAlign: 'left'
};

export default AlertaEvasao;