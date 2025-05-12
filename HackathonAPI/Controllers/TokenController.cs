using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;
using HackathonAPI.Models;
using Microsoft.AspNetCore.ResponseCompression;

namespace HackathonAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TokenController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public TokenController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpGet]
        public async Task<IActionResult> GetToken()
        {
            var credentials = new
            {
                email = "hackathon@unifenas.br",
                password = "hackathon#2025"
            };

            var content = new StringContent(JsonConvert.SerializeObject(credentials), Encoding.UTF8,
                "apllication/json");
            var response = await _httpClient.PostAsync("https://api.unifenas.br/v1/get-token", content);

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Erro ao obter token");
            }
            var result = JsonConvert.DeserializeObject<TokenResponse>
                (await response.Content.ReadAsStringAsync());
            return Ok(result);
        }
        
    }
}
