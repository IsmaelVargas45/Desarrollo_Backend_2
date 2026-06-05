using Microsoft.EntityFrameworkCore;

namespace Desarrollo_Backend_2.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Tarea> Tareas { get; set; }
}