import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    await executeQuery(`ALTER TABLE Usuarios DROP CONSTRAINT UQ__Usuarios__E3237CF744EB1135`);
    return NextResponse.json({ success: true, message: "Constraint dropped" });
  } catch (error: any) {
    console.error("Error in scratch route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

