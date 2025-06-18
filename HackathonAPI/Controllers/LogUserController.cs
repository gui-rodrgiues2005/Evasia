using HackathonAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class LogsUsuarioController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private static string _cachedToken;
    private static DateTime _tokenExpirationTime;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public LogsUsuarioController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    [HttpPost("logs-batch")]
    public async Task<IActionResult> GetLogsBatch([FromBody] List<string> userIds)
    {
        try
        {
            var token = await ObtainToken();
            var results = new List<object>();

            // Processa em lotes de 5 usuários
            for (int i = 0; i < userIds.Count; i += 5)
            {
                var batch = userIds.Skip(i).Take(5);
                var batchTasks = batch.Select(async userId =>
                {
                    try
                    {
                        var request = new HttpRequestMessage
                        {
                            Method = HttpMethod.Get,
                            RequestUri = new Uri("https://api.unifenas.br/v1/moodle/logs-usuario"),
                            Content = new StringContent(
                                JsonConvert.SerializeObject(new { user_id = userId }), 
                                Encoding.UTF8, 
                                "application/json"
                            )
                        };
                        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                        var response = await _httpClient.SendAsync(request);
                        var content = await response.Content.ReadAsStringAsync();

                        return new
                        {
                            userId,
                            logs = response.IsSuccessStatusCode 
                                ? JsonConvert.DeserializeObject<List<LogResponse>>(content)
                                : new List<LogResponse>()
                        };
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Erro ao buscar logs para usuário {userId}: {ex.Message}");
                        return new { userId, logs = new List<LogResponse>() };
                    }
                });

                var batchResults = await Task.WhenAll(batchTasks);
                results.AddRange(batchResults);

                // Delay entre lotes para evitar sobrecarga
                if (i + 5 < userIds.Count)
                {
                    await Task.Delay(1000);
                }
            }

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erro interno: {ex.Message}");
        }
    }

    private async Task<string> ObtainToken()
    {
        // Verifica se já tem um token válido em cache
        if (!string.IsNullOrEmpty(_cachedToken) && DateTime.Now < _tokenExpirationTime)
        {
            return _cachedToken;
        }

        // Usa semáforo para evitar múltiplas requisições simultâneas de token
        await _semaphore.WaitAsync();
        try
        {
            // Double-check para evitar que múltiplas threads obtenham token
            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.Now < _tokenExpirationTime)
            {
                return _cachedToken;
            }

            var credentials = new
            {
                email = "hackathon@unifenas.br",
                password = "hackathon#2025"
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(credentials),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(
                "https://api.unifenas.br/v1/get-token",
                content
            );

            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Erro ao obter token: {response.StatusCode}");
                Console.WriteLine($"Conteúdo da resposta: {responseContent}");
                throw new Exception("Não foi possível obter o token. Verifique as credenciais ou o endpoint.");
            }

            var token = JsonConvert.DeserializeObject<TokenResponse>(responseContent);

            // Salva o token em cache por 55 minutos (assumindo que expire em 1 hora)
            _cachedToken = token.access_token;
            _tokenExpirationTime = DateTime.Now.AddMinutes(55);

            return _cachedToken;
        }
        finally
        {
            _semaphore.Release();
        }
    }
}