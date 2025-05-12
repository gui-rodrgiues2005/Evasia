using HackathonAPI.Models;

namespace HackathonAPI.Services
{
    public interface IUnifenasApiService
    {
        Task<List<LogResponse>?> GetLogsByUserId(string userId);
        Task<List<MoodleUser>?> GetUsuarios();
    }
}

