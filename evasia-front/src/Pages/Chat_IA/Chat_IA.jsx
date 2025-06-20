import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './Chat_IA.scss';

const ChatIA = () => {
  const { user_id } = useParams();
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState([
    { sender: 'ia', text: 'Olá! Sou a IA de apoio. Como posso ajudar te ajudar ?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5164/api/Alerts/get-ai-response/${user_id}`);
        if (res.ok) {
          const data = await res.json();
          setAiResponse(typeof data === 'string' ? JSON.parse(data) : data);
        }
      } catch (err) {
        setAiResponse(null);
      }
      setLoading(false);
    }
    fetchAnalysis();
  }, [user_id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    setChat(prev => [...prev, { sender: 'prof', text: input }]);
    setInput('');
    setTimeout(() => {
      setChat(prev => [
        ...prev,
        { sender: 'ia', text: 'Recebi sua pergunta! Em breve responderei com mais detalhes.' }
      ]);
      setSending(false);
    }, 1200);
  };

  const riscoColor = {
    'ALTO': 'alto',
    'MÉDIO': 'medio',
    'BAIXO': 'baixo'
  };

  return (
    <div className="chatia-container">
      <h2 className="chatia-title">
        Análise Detalhada da IA
      </h2>
      <p className="chatia-desc">
        Veja o diagnóstico e converse com a IA sobre o aluno.
      </p>

      {loading ? (
        <div className="chatia-loading">Carregando análise...</div>
      ) : aiResponse ? (
        <>
          {/* Cards Resumo */}
          <div className="chatia-cards">
            <div className="chatia-card">
              <div className="chatia-card-label">Aluno</div>
              <div className="chatia-card-main">{aiResponse.student_name}</div>
              <div className="chatia-card-sub">{aiResponse.course_info}</div>
            </div>
            <div className="chatia-card">
              <div className="chatia-card-label">Último acesso</div>
              <div className="chatia-card-main">
                {aiResponse.last_access_analysis?.days_since_access} dias atrás
              </div>
              <div className="chatia-card-sub">
                {aiResponse.last_access_analysis?.last_access_date?.split('T')[0]} ({aiResponse.last_access_analysis?.access_frequency})
              </div>
            </div>
            <div className="chatia-card">
              <div className="chatia-card-label">Nível de risco</div>
              <div className={`chatia-card-main chatia-risco ${riscoColor[aiResponse.risk_assessment?.risk_level] || ''}`}>
                {aiResponse.risk_assessment?.risk_level}
              </div>
              <div className="chatia-card-sub">
                Score: {aiResponse.risk_assessment?.risk_score} | Confiança: {aiResponse.risk_assessment?.confidence}%
              </div>
            </div>
          </div>

          {/* Recomendações e fatores */}
          <div className="chatia-row">
            <div className="chatia-col">
              <h3 className="chatia-section-title">Fatores de risco</h3>
              <ul className="chatia-list">
                {(aiResponse.risk_assessment?.primary_risk_factors || []).map((f, i) => (
                  <li key={i} className="chatia-risk">{f}</li>
                ))}
              </ul>
              <h3 className="chatia-section-title">Fatores protetivos</h3>
              <ul className="chatia-list">
                {(aiResponse.risk_assessment?.protective_factors || []).map((f, i) => (
                  <li key={i} className="chatia-protect">{f}</li>
                ))}
              </ul>
            </div>
            <div className="chatia-col">
              <h3 className="chatia-section-title">Recomendações da IA</h3>
              <ul className="chatia-list">
                <li><strong>Ações imediatas:</strong> {(aiResponse.recommendations?.immediate_actions || []).join(', ')}</li>
                <li><strong>Acompanhamento:</strong> {(aiResponse.recommendations?.follow_up_actions || []).join(', ')}</li>
                <li><strong>Prioridade de contato:</strong> {aiResponse.recommendations?.contact_priority}</li>
              </ul>
            </div>
          </div>

          {/* Histórico da análise */}
          <div className="chatia-historico">
            <h4>Histórico da análise</h4>
            <div className="chatia-historico-list">
              <div><strong>Progresso no curso:</strong> {aiResponse.academic_status?.course_progress}</div>
              <div><strong>Média atual:</strong> {aiResponse.academic_status?.current_grades}</div>
              <div><strong>Status das atividades:</strong> {aiResponse.academic_status?.assignments_status}</div>
              <div><strong>Analisado em:</strong> {aiResponse.analysis_metadata?.analyzed_at?.replace('T', ' ').slice(0, 19)}</div>
              <div><strong>Fonte:</strong> {aiResponse.analysis_metadata?.data_source}</div>
              <div><strong>Analista:</strong> {aiResponse.analysis_metadata?.analyst}</div>
            </div>
          </div>

          {/* Chat com a IA */}
          <div className="chatia-chatbox">
            <h3 className="chatia-section-title">Converse com a IA</h3>
            <div className="chatia-chat-messages">
              {chat.map((msg, idx) => (
                <div key={idx} className={`chatia-msg ${msg.sender}`}>
                  <div className="chatia-msg-bubble">{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="chatia-chat-input-row">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite sua pergunta para a IA..."
                className="chatia-chat-input"
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="chatia-chat-btn"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="chatia-error">
          Não foi possível carregar a análise da IA para este aluno.
        </div>
      )}
    </div>
  );
};

export default ChatIA;