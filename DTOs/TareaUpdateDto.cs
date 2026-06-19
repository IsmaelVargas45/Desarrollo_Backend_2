// DTOs/TareaUpdateDto.cs
public class TareaUpdateDto
{
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public bool? Completada { get; set; }
    public string? UsuarioAsignadoId { get; set; } // Solo para Admin
}