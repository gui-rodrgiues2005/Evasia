using HackathonAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Threading.Tasks;
using HackathonAPI.Services;

namespace HackathonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlertsController : ControllerBase
    {
        private static Dictionary<string, string> _chatResponses = new Dictionary<string, string>();
        // ^ Idealmente, isso seria um banco de dados para persistência e escalabilidade.
        // Usamos Dictionary para demonstração rápida.

        private readonly IAlunoService _alunoService;

        public AlertsController(IAlunoService alunoService)
        {
            _alunoService = alunoService;
        }

        [HttpGet("dados-para-analise/{userId}")]
        public async Task<IActionResult> ObterDadosParaAnalise(string userId)
        {
            var dados = await _alunoService.ObterDadosParaAnaliseAsync(userId);

            if (dados == null)
                return NotFound(new { message = "Dados do aluno não encontrados." });

            return Ok(dados);
        }

        [HttpPost("receive-ai-response")]
        public IActionResult ReceiveAIResponse([FromBody] string aiAnalysisJson) // Recebe a string JSON bruta
        {
            Console.WriteLine($"[ChatAIController] Resposta da IA recebida: {aiAnalysisJson}");

            string userId = "unknown_user";
            try
            {
                dynamic analysis = JsonConvert.DeserializeObject<dynamic>(aiAnalysisJson);
                if (analysis.user_id != null)
                {
                    userId = analysis.user_id.ToString();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao extrair user_id da análise da IA: {ex.Message}");
            }

            _chatResponses[userId] = aiAnalysisJson;

            return Ok(new { message = "Resposta da IA recebida com sucesso pela API.", userId = userId });
        }


        [HttpGet("get-ai-response/{userId}")]
        public IActionResult GetAIResponse(string userId)
        {
            if (_chatResponses.ContainsKey(userId))
            {
                return Ok(JsonConvert.DeserializeObject(_chatResponses[userId]));
            }
            return NotFound(new { message = $"Nenhuma resposta da IA encontrada para o usuário {userId}." });
        }
    }
}
