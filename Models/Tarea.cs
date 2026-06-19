// Models/Tarea.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Desarrollo_Backend_2.Models
{
    public class Tarea
    {
        public int Id { get; set; }

        [Required]
        public string Titulo { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public bool Completada { get; set; } = false;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Clave foránea al usuario asignado
        public string? UsuarioAsignadoId { get; set; }

        [ForeignKey("UsuarioAsignadoId")]
        public virtual ApplicationUser? UsuarioAsignado { get; set; }

        // Opcional: quién creó la tarea (admin)
        public string? CreadaPorId { get; set; }
        [ForeignKey("CreadaPorId")]
        public virtual ApplicationUser? CreadaPor { get; set; }
    }
}