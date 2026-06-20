// Controllers/AuthController.cs
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Desarrollo_Backend_2.Models;
using Desarrollo_Backend_2.DTOs; // Vamos a crear DTOs
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
                NombreCompleto = model.NombreCompleto
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(new { message = "Error al crear usuario", errors = result.Errors });

            // Asignar rol "User" por defecto
            await _userManager.AddToRoleAsync(user, "User");

            return Ok(new { message = "Usuario registrado exitosamente" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
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
            return Unauthorized(new { message = "Credenciales inválidas" });
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