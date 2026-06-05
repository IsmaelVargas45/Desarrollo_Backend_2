using Microsoft.AspNetCore.Mvc;
using Desarrollo_Backend_2.Models;
using Desarrollo_Backend_2.Services;

namespace Desarrollo_Backend_2.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TareasController : ControllerBase
{
    private readonly ITareaService _service;
    public TareasController(ITareaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var tarea = await _service.GetByIdAsync(id);
        return tarea == null ? NotFound() : Ok(tarea);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Tarea tarea)
    {
        if (string.IsNullOrWhiteSpace(tarea.Titulo))
            return BadRequest("El título es obligatorio");
        
        var creada = await _service.CreateAsync(tarea);
        return CreatedAtAction(nameof(GetById), new { id = creada.Id }, creada);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Tarea tarea)
    {
        if (id != tarea.Id) return BadRequest("El ID no coincide");
        var result = await _service.UpdateAsync(id, tarea);
        return result ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        return result ? NoContent() : NotFound();
    }
}