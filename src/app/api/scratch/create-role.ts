import { executeQuery } from "../../../lib/db";

async function main() {
  const result = await executeQuery(
    `INSERT INTO Roles (NombreRol, Activo) 
     OUTPUT INSERTED.* 
     VALUES (@NombreRol, 1)`,
    {
      NombreRol: "Soporte",
    }
  );
  console.log("Rol creado:", result.recordset[0]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });

