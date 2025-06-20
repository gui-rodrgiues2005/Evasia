using System.Threading.Tasks;

namespace HackathonAPI.Services
{
    public interface IAlunoService
    {
        Task<object?> ObterDadosParaAnaliseAsync(string userId);
    }
}