using Desarrollo_Backend_2.Models;

namespace Desarrollo_Backend_2.Services;

public interface ITareaService
{
    Task<List<Tarea>> GetAllAsync();
    Task<Tarea?> GetByIdAsync(int id);
    Task<Tarea> CreateAsync(Tarea tarea);
    Task<bool> UpdateAsync(int id, Tarea tarea);
    Task<bool> DeleteAsync(int id);
}