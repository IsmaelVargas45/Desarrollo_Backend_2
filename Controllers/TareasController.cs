// Controllers/TareasController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Desarrollo_Backend_2.Data;
using Desarrollo_Backend_2.Models;
using Desarrollo_Backend_2.DTOs;

namespace Desarrollo_Backend_2.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Requiere autenticación para todos los endpoints
    public class TareasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public TareasController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/tareas (Admin ve todas, User solo las suyas)
        [HttpGet]
        public async Task<IActionResult> GetTareas()
        {
            var user = await _userManager.GetUserAsync(User);
            var roles = await _userManager.GetRolesAsync(user);

            IQueryable<Tarea> query = _context.Tareas.Include(t => t.UsuarioAsignado);

            if (roles.Contains("Admin"))
            {
                // Admin ve todas
                return Ok(await query.ToListAsync());
            }
            else
            {
                // Usuario normal solo ve las suyas
                var tareas = await query.Where(t => t.UsuarioAsignadoId == user.Id).ToListAsync();
                return Ok(tareas);
            }
        }

        // GET: api/tareas/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTarea(int id)
        {
            var tarea = await _context.Tareas.Include(t => t.UsuarioAsignado)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (tarea == null) return NotFound();

            var user = await _userManager.GetUserAsync(User);
            var roles = await _userManager.GetRolesAsync(user);

            // Admin puede ver cualquier tarea, usuario solo la suya
            if (!roles.Contains("Admin") && tarea.UsuarioAsignadoId != user.Id)
                return Forbid();

            return Ok(tarea);
        }

        // POST: api/tareas (Solo Admin puede crear y asignar)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTarea([FromBody] TareaCreateDto dto)
        {
            var admin = await _userManager.GetUserAsync(User);

            var tarea = new Tarea
            {
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                UsuarioAsignadoId = dto.UsuarioAsignadoId,
                CreadaPorId = admin.Id,
                Completada = false,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Tareas.Add(tarea);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTarea), new { id = tarea.Id }, tarea);
        }

        // PUT: api/tareas/{id} (Admin puede editar cualquier campo, User solo puede marcar completada)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTarea(int id, [FromBody] TareaUpdateDto dto)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null) return NotFound();

            var user = await _userManager.GetUserAsync(User);
            var roles = await _userManager.GetRolesAsync(user);

            if (roles.Contains("Admin"))
            {
                // Admin puede modificar todo
                tarea.Titulo = dto.Titulo ?? tarea.Titulo;
                tarea.Descripcion = dto.Descripcion ?? tarea.Descripcion;
                tarea.Completada = dto.Completada ?? tarea.Completada;
                if (!string.IsNullOrEmpty(dto.UsuarioAsignadoId))
                    tarea.UsuarioAsignadoId = dto.UsuarioAsignadoId;
            }
            else
            {
                // Usuario solo puede cambiar Completada, y solo si la tarea es suya
                if (tarea.UsuarioAsignadoId != user.Id)
                    return Forbid();

                // Solo permitir cambiar Completada
                if (dto.Completada.HasValue)
                    tarea.Completada = dto.Completada.Value;
                else
                    return BadRequest(new { message = "Solo puedes modificar el estado 'Completada'" });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/tareas/{id} (Solo Admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTarea(int id)
        {
            var tarea = await _context.Tareas.FindAsync(id);
            if (tarea == null) return NotFound();

            _context.Tareas.Remove(tarea);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/tareas/usuarios (Admin obtiene lista de usuarios para asignar)
        [HttpGet("usuarios")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _userManager.Users
                .Select(u => new { u.Id, u.Email, u.NombreCompleto })
                .ToListAsync();
            return Ok(usuarios);
        }
    }
}