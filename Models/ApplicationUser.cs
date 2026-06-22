// Models/ApplicationUser.cs
using Microsoft.AspNetCore.Identity;

namespace Desarrollo_Backend_2.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Puedes agregar propiedades extra si quieres
        public string? NombreCompleto { get; set; }

    }
}
