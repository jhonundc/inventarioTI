import { config } from "dotenv";
config();
import { executeQuery } from "./src/lib/db";

async function run() {
  try {
    const result = await executeQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Usuarios'");
    console.log("Usuarios columns:");
    console.log(result.recordset);
    const rolesResult = await executeQuery("SELECT * FROM Roles");
    console.log("Roles:");
    console.log(rolesResult.recordset);
  } catch (error) {
    console.error(error);
  }
}
run();
