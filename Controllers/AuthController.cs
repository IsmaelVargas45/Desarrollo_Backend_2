// Controllers/AuthController.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Desarrollo_Backend_2.Models;
using Desarrollo_Backend_2.DTOs; // Vamos a crear DTOs
using Microsoft.EntityFrameworkCore;
namespace Desarrollo_Backend_2.Controllers

{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;

        public AuthController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return BadRequest(new { message = "El usuario ya existe" });

            var user = new ApplicationUser
            {
                Email = model.Email,
                UserName = model.Email,
                NombreCompleto = model.NombreCompleto,
                NormalizedEmail = _userManager.NormalizeEmail(model.Email),
                NormalizedUserName = _userManager.NormalizeName(model.Email)
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded){
                var errors = result.Errors.Select(e => e.Description);
                return BadRequest(new { message = "Error al crear usuario", errors = result.Errors });
            }
            // Forzar la actualización del NormalizedEmail (por si acaso)
            await _userManager.UpdateNormalizedEmailAsync(user);
            await _userManager.UpdateNormalizedUserNameAsync(user);

            // Asegurar rol "User"
            if (!await _roleManager.RoleExistsAsync("User"))
                await _roleManager.CreateAsync(new IdentityRole("User"));
        
            await _userManager.AddToRoleAsync(user, "User");
        
            return Ok(new { message = "Usuario registrado exitosamente" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
    
    Console.WriteLine($"📧 Email recibido: '{model.Email}'");
    Console.WriteLine($"📧 Longitud: {model.Email?.Length}");

    // 1. Búsqueda normal (FindByEmailAsync)
    var user = await _userManager.FindByEmailAsync(model.Email);
    Console.WriteLine($"🔍 FindByEmailAsync: {(user != null ? "✅ Encontrado" : "❌ No encontrado")}");

    // 2. Búsqueda directa sin normalización
    var userDirect = await _userManager.Users
        .FirstOrDefaultAsync(u => u.Email == model.Email);
    Console.WriteLine($"🔍 Búsqueda directa (Email): {(userDirect != null ? "✅ Encontrado" : "❌ No encontrado")}");

    // 3. Búsqueda por UserName
    var userByName = await _userManager.FindByNameAsync(model.Email);
    Console.WriteLine($"🔍 FindByNameAsync: {(userByName != null ? "✅ Encontrado" : "❌ No encontrado")}");

    // 4. Búsqueda ignorando mayúsculas/minúsculas
    var userIgnoreCase = await _userManager.Users
        .FirstOrDefaultAsync(u => u.Email.ToLower() == model.Email.ToLower());
    Console.WriteLine($"🔍 Búsqueda ignore case: {(userIgnoreCase != null ? "✅ Encontrado" : "❌ No encontrado")}");

    // Si algún método lo encuentra, usamos ese usuario
    user = user ?? userDirect ?? userByName ?? userIgnoreCase;

    if (user == null)
        return Unauthorized(new { message = "Usuario no encontrado" });


        // Verificar contraseña
        var passwordValid = await _userManager.CheckPasswordAsync(user, model.Password);
        if (!passwordValid)
        {
            return Unauthorized(new { message = "Contraseña incorrecta" });
        }
    
        // Si llega aquí, las credenciales son correctas
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
    
        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            authClaims.Add(new Claim(ClaimTypes.Role, role));
        }
    
        var token = GenerateJwtToken(authClaims);
        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            expiration = token.ValidTo,
            roles = roles,
            email = user.Email,
            nombre = user.NombreCompleto
        });
        }

        private JwtSecurityToken GenerateJwtToken(List<Claim> authClaims)
        {
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "mi-clave-secreta-de-mas-de-16-caracteres"));
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
            return token;
        }
    }
}