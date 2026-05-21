import { executeQuery } from "../lib/db";
import bcrypt from "bcrypt";

async function main() {
  const username = "admin";
  const password = "admin123";
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Asegurarse de que existan los roles
  let adminRolResult = await executeQuery(
    "SELECT * FROM Roles WHERE NombreRol = 'ADMINISTRADOR'"
  );
  let adminRol = adminRolResult.recordset[0];

  if (!adminRol) {
    console.log("Creando rol ADMINISTRADOR...");
    const createRolResult = await executeQuery(
      "INSERT INTO Roles (NombreRol, Activo) OUTPUT INSERTED.IdRol, INSERTED.NombreRol, INSERTED.Activo VALUES ('ADMINISTRADOR', 1)"
    );
    adminRol = createRolResult.recordset[0];
  }

  // 2. Crear el usuario
  const existingUserResult = await executeQuery(
    "SELECT * FROM Usuarios WHERE Usuario = @Usuario",
    { Usuario: username }
  );
  const existingUser = existingUserResult.recordset[0];

  if (existingUser) {
    console.log(`El usuario ${username} ya existe.`);
    return;
  }

  console.log(`Creando usuario ${username}...`);
  const userResult = await executeQuery(
    `INSERT INTO Usuarios (Usuario, Clave, Nombres, Cargo, IdRol, Activo, FechaCreacion) 
     OUTPUT INSERTED.IdUsuario, INSERTED.Usuario, INSERTED.Nombres, INSERTED.Cargo, INSERTED.IdRol, INSERTED.Activo, INSERTED.FechaCreacion
     VALUES (@Usuario, @Clave, @Nombres, @Cargo, @IdRol, 1, GETDATE())`,
    {
      Usuario: username,
      Clave: hashedPassword,
      Nombres: "Administrador del Sistema",
      Cargo: "Administrador",
      IdRol: adminRol.IdRol,
    }
  );

  console.log("Usuario creado exitosamente:", userResult.recordset[0]);
}

main()
  .catch((e) => {
    console.error("Error al crear el usuario:", e);
    process.exit(1);
  });

