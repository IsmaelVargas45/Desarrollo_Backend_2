// DTOs/TareaCreateDto.cs
public class TareaCreateDto
{
    public string Titulo { get; set; }
    public string? Descripcion { get; set; }
    public string UsuarioAsignadoId { get; set; } // Id del usuario a asignar
}

