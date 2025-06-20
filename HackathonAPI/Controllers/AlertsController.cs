using HackathonAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Threading.Tasks;

namespace HackathonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlertsController : ControllerBase
    {
        private static Dictionary<string, string> _chatResponses = new Dictionary<string, string>();
    // ^ Idealmente, isso seria um banco de dados para persistência e escalabilidade.
    // Usamos Dictionary para demonstração rápida.

    [HttpPost("receive-ai-response")]
    public IActionResult ReceiveAIResponse([FromBody] object aiAnalysisData) // Recebe o JSON completo da IA
    {
        // O ideal é ter um modelo C# que mapeie exatamente o JSON de saída da IA.
        // Por simplicidade, estamos recebendo como 'object' e serializando/deserializando.

        string jsonString = JsonConvert.SerializeObject(aiAnalysisData);
        Console.WriteLine($"[ChatAIController] Resposta da IA recebida: {jsonString}");

        // Tente extrair o user_id da análise da IA
        string userId = "unknown_user";
        try
        {
            dynamic analysis = JsonConvert.DeserializeObject<dynamic>(jsonString);
            if (analysis.user_id != null)
            {
                userId = analysis.user_id.ToString();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao extrair user_id da análise da IA: {ex.Message}");
        }

        // Armazena a resposta da IA. Associa ao user_id para recuperação posterior.
        // Para um chat real, você precisaria de uma estrutura mais complexa
        // para histórico, timestamps, etc.
        _chatResponses[userId] = jsonString;

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
