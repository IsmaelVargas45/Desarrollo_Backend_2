namespace Desarrollo_Backend_2.Models;

public class Tarea
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;   // ← inicializado
    public string Descripcion { get; set; } = string.Empty; // ← inicializado
    public bool Completada { get; set; }
    public DateTime FechaCreacion { get; set; }
}