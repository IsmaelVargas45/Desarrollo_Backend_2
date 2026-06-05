using Microsoft.EntityFrameworkCore;
using Desarrollo_Backend_2.Models;

namespace Desarrollo_Backend_2.Services;

public class TareaService : ITareaService
{
    private readonly AppDbContext _context;
    public TareaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Tarea>> GetAllAsync() =>
        await _context.Tareas.ToListAsync();

    public async Task<Tarea?> GetByIdAsync(int id) =>
        await _context.Tareas.FindAsync(id);

    public async Task<Tarea> CreateAsync(Tarea tarea)
    {
        tarea.FechaCreacion = DateTime.Now;
        _context.Tareas.Add(tarea);
        await _context.SaveChangesAsync();
        return tarea;
    }

    public async Task<bool> UpdateAsync(int id, Tarea tareaActualizada)
    {
        var tarea = await _context.Tareas.FindAsync(id);
        if (tarea == null) return false;
        tarea.Titulo = tareaActualizada.Titulo;
        tarea.Descripcion = tareaActualizada.Descripcion;
        tarea.Completada = tareaActualizada.Completada;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tarea = await _context.Tareas.FindAsync(id);
        if (tarea == null) return false;
        _context.Tareas.Remove(tarea);
        await _context.SaveChangesAsync();
        return true;
    }
}