import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const result = await executeQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Usuarios'");
    const rolesResult = await executeQuery("SELECT * FROM Roles");
    return NextResponse.json({ columns: result.recordset, roles: rolesResult.recordset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
