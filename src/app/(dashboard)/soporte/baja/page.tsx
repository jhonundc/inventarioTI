"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Search, Eye, Printer, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { getCondiciones, getEstados } from "@/app/actions/catalogs";

const fetchBajas = async () => {
  const res = await fetch("/api/soporte/baja");
  if (!res.ok) throw new Error("Error al cargar las fichas de baja");
  return res.json();
};

const fetchBienes = async () => {
  const res = await fetch("/api/bienes");
  if (!res.ok) throw new Error("Error al cargar los bienes");
  return res.json();
};

const CONDICION_OPTIONS = ["Operativo", "Inoperativo"];
const ESTADO_OPTIONS = ["Bueno", "Regular", "Malo por reparar", "Malo para baja"];
const TIPO_BIEN_OPTIONS = [
  "Informático",
  "Comunicación",
  "Biomédico",
  "Mobiliario",
  "Eléctricos/electrónicos/electromecánico",
  "Mobiliario Clínico",
];
const DEPENDENCIA_OPTIONS = [
  "Gerencia",
  "Administración",
  "Logística",
  "Laboratorio",
  "Mantenimiento",
  "Unidad de TI",
];
const RECOMENDACION_OPTIONS = ["Dar de baja", "Recuperar", "Reasignar"];
const CAUSAL_BAJA_OPTIONS = [
  "Obsolescencia técnica",
  "Estado de excedencia",
  "Mantenimiento o reparación onerosa",
  "Siniestro o destrucción",
  "Reposición",
  "Estado de chatarra",
  "RAEE",
  "Otros",
];

const getCondicionBadgeClass = (value?: string) => {
  const normalized = (value || "").toLowerCase();
  return normalized.includes("inoperativo")
    ? "bg-rose-100 text-rose-700 border-rose-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const getEstadoBadgeClass = (value?: string) => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("malo para baja") || normalized.includes("malo por reparar")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (normalized.includes("regular")) {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

export default function FichaBajaPage() {
  const [open, setOpen] = useState(false);
  const [editingBaja, setEditingBaja] = useState<any>(null);
  const [formData, setFormData] = useState({
    IdCondicion: "",
    IdEstadoBien: "",
    Recomendacion: "",
    CausalBaja: "",
  });
  const [printOpen, setPrintOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<any>(null);
  const [buscarText, setBuscarText] = useState("");
  const [bienSearch, setBienSearch] = useState("");
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      NumeroFichaBaja: "",
      UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
      Dependencia: "",
      IdBien: "",
      Prioridad: "",
      TipoBien: "",
      IdCondicion: "",
      IdEstadoBien: "",
      CausalBaja: "",
      Recomendacion: "",
      Observacion: "",
      Fundamentacion: "",
      IdUsuarioRegistro: "",
    },
  });

  const { data: bajas, isLoading } = useQuery({
    queryKey: ["fichasBaja"],
    queryFn: fetchBajas,
  });

  const { data: bienes } = useQuery({ queryKey: ["bienes"], queryFn: fetchBienes });
  const { data: condiciones } = useQuery({ queryKey: ["condiciones"], queryFn: () => getCondiciones() });
  const { data: estados } = useQuery({ queryKey: ["estados"], queryFn: () => getEstados() });
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingBaja ? "PATCH" : "POST";
      const res = await fetch("/api/soporte/baja", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBaja ? { ...data, IdBaja: editingBaja.IdBaja } : data),
      });
      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Error al ${editingBaja ? "actualizar" : "crear"} la ficha: ${errorBody}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fichasBaja"] });
      setOpen(false);
      setFormData({ IdCondicion: "", IdEstadoBien: "", Recomendacion: "", CausalBaja: "" });
      reset();
      setEditingBaja(null);
    },
    onError: (error: any) => {
      alert(error?.message || "No se pudo guardar la ficha de baja. Revise los datos e intente de nuevo.");
    },
  });

  const handleSelectField = (field: "IdCondicion" | "IdEstadoBien" | "Recomendacion" | "CausalBaja", value: string) => {
    setValue(field as any, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (data: any) => {
    if (!data.NumeroFichaBaja) {
      alert("La ficha debe tener un número.");
      return;
    }
    if (!data.IdBien) {
      alert("Seleccione un bien antes de guardar la ficha.");
      return;
    }
    if (!data.TipoBien) {
      alert("Seleccione el tipo de bien.");
      return;
    }
    if (!data.IdCondicion) {
      alert("Seleccione la condición del bien.");
      return;
    }
    if (!data.IdEstadoBien) {
      alert("Seleccione el estado del bien.");
      return;
    }
    if (!data.CausalBaja) {
      alert("Seleccione la causal de baja.");
      return;
    }
    if (!data.Recomendacion) {
      alert("Seleccione la recomendación.");
      return;
    }
    if (!data.Fundamentacion) {
      alert("Complete la fundamentación.");
      return;
    }

    const userId = sessionData?.user?.id || data.IdUsuarioRegistro || null;
    const payload = {
      ...data,
      IdUsuarioRegistro: userId ? String(userId) : null,
    };

    console.log("Guardando ficha de baja:", payload);
    mutation.mutate(payload);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/soporte/baja?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar la ficha");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fichasBaja"] });
    },
  });

  const handleEdit = (baja: any) => {
    setEditingBaja(baja);
    setValue("NumeroFichaBaja", baja.NumeroFichaBaja);
    setValue("UnidadOrganica", baja.UnidadOrganica || "");
    setValue("IdBien", baja.IdBien?.toString() || "");
    setValue("Responsable", baja.Responsable || "");
    setValue("Dependencia", baja.Dependencia || "");
    setValue("Ambiente", baja.Ambiente || "");
    setValue("TipoBien", baja.TipoBien || "");
    setValue("Prioridad", baja.Prioridad || "");
    setValue("IdCondicion", baja.IdCondicion?.toString() || "");
    setValue("IdEstadoBien", baja.IdEstadoBien?.toString() || "");
    setValue("Fundamentacion", baja.Fundamentacion || "");
    setValue("Recomendacion", baja.Recomendacion || "");
    setValue("CausalBaja", baja.CausalBaja || "");
    setValue("Observacion", baja.Observacion || "");
    setValue("IdUsuarioRegistro", baja.IdUsuarioRegistro?.toString() || sessionData?.user?.id?.toString() || "");
    setFormData({
      IdCondicion: baja.IdCondicion?.toString() || "",
      IdEstadoBien: baja.IdEstadoBien?.toString() || "",
      Recomendacion: baja.Recomendacion || "",
      CausalBaja: baja.CausalBaja || "",
    });
    setOpen(true);
  };

  const handleView = (baja: any) => {
    setSelectedFicha(baja);
    setDetailOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Desea eliminar esta ficha de baja?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      alert("No se pudo eliminar la ficha");
    }
  };

  const handleExportSingleExcel = async (baja: any) => {
    const XLSX = await import("xlsx");

    const tipo = (baja.TipoBien || "").toLowerCase();
    const condicion = (baja.Condicion?.Condicion || "").toLowerCase();
    const estado = (baja.Estado?.EstadoBien || "").toLowerCase();

    const darkHeaderStyle = {
      font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 12 },
      fill: { fgColor: { rgb: "FF111827" } },
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
      alignment: { vertical: "center", horizontal: "left" },
    };

    const sectionStyle = {
      font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 10 },
      fill: { fgColor: { rgb: "FF1F2937" } },
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
      alignment: { vertical: "center", horizontal: "left" },
    };

    const labelStyle = {
      font: { bold: true, color: { rgb: "FF334155" }, sz: 9 },
      fill: { fgColor: { rgb: "FFF8FAFC" } },
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
      alignment: { vertical: "center", horizontal: "left" },
    };

    const valueStyle = {
      font: { color: { rgb: "FF111827" }, sz: 10 },
      fill: { fgColor: { rgb: "FFFFFFFF" } },
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
      alignment: { vertical: "top", horizontal: "left", wrapText: true },
    };

    const accentStyle = {
      font: { bold: true, color: { rgb: "FF2563EB" }, sz: 10 },
      fill: { fgColor: { rgb: "FFEFF6FF" } },
      border: {
        top: { style: "thin", color: { rgb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { rgb: "FFE5E7EB" } },
        left: { style: "thin", color: { rgb: "FFE5E7EB" } },
        right: { style: "thin", color: { rgb: "FFE5E7EB" } },
      },
      alignment: { vertical: "center", horizontal: "center" },
    };

    const rows = [
      ["FICHA DE BAJA DE BIENES", "", "", ""],
      ["UNIDAD DE ESTADISTICA E INFORMATICA", "", "", ""],
      ["", "", "", ""],
      ["RESPONSABLE DEL BIEN", "DEPENDENCIA (ÁREA)", "AMBIENTE", "Nº FICHA"],
      [baja.Responsable || "", baja.Dependencia || "", baja.Ambiente || "", baja.NumeroFichaBaja || ""],
      ["", "", "", ""],
      ["I. TIPO DEL BIEN"],
      ["Informático", "Comunicación", "Biomédico", "Mobiliario", "Otros"],
      [
        tipo.includes("informático") || tipo.includes("informatico") ? "✔" : "",
        tipo.includes("comunicación") || tipo.includes("comunicacion") ? "✔" : "",
        tipo.includes("biomédico") || tipo.includes("biomedico") ? "✔" : "",
        tipo.includes("mobiliario") ? "✔" : "",
        tipo.includes("eléctrico") || tipo.includes("electrico") || tipo.includes("electromec") ? "✔" : "",
      ],
      ["", "", "", ""],
      ["II. DETALLE TÉCNICO DEL BIEN"],
      ["Bien / Descripción", "Código Inventario", "Código Patrimonial", "Marca", "Modelo", "Nº Serie"],
      [
        baja.Bien?.Descripcion || "",
        baja.Bien?.CodigoInventario || "",
        baja.Bien?.CodigoPatrimonial || "",
        baja.Bien?.Marca?.Marca || "",
        baja.Bien?.Modelo?.Modelo || "",
        baja.Bien?.NumeroSerie || "",
      ],
      ["", "", "", ""],
      ["III. CONDICIÓN DEL BIEN", "IV. ESTADO DEL BIEN"],
      ["Operativo", "Inoperativo", "Bueno", "Regular", "Malo por reparar", "Malo para baja"],
      [
        condicion.includes("operativo") ? "✔" : "",
        condicion.includes("inoperativo") ? "✔" : "",
        estado.includes("bueno") ? "✔" : "",
        estado.includes("regular") ? "✔" : "",
        estado.includes("malo por reparar") ? "✔" : "",
        estado.includes("malo para baja") ? "✔" : "",
      ],
      ["", "", "", ""],
      ["V. CAUSAL DE BAJA"],
      [baja.CausalBaja || ""],
      ["", "", "", ""],
      ["VI. FUNDAMENTACIÓN"],
      [baja.Fundamentacion || ""],
      ["", "", "", ""],
      ["VII. RECOMENDACIÓN"],
      [baja.Recomendacion || ""],
      ["", "", "", ""],
      ["REGISTRADO POR", "", "", ""],
      [baja.UsuarioRegistro?.Nombres || baja.UsuarioRegistro?.Usuario || "", "", "", ""],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 3 } },
      { s: { r: 3, c: 0 }, e: { r: 4, c: 3 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 5 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 5 } },
      { s: { r: 10, c: 0 }, e: { r: 10, c: 5 } },
      { s: { r: 11, c: 0 }, e: { r: 12, c: 5 } },
      { s: { r: 14, c: 0 }, e: { r: 14, c: 1 } },
      { s: { r: 14, c: 2 }, e: { r: 14, c: 5 } },
      { s: { r: 15, c: 0 }, e: { r: 15, c: 5 } },
      { s: { r: 17, c: 0 }, e: { r: 17, c: 5 } },
      { s: { r: 18, c: 0 }, e: { r: 18, c: 5 } },
      { s: { r: 20, c: 0 }, e: { r: 20, c: 5 } },
      { s: { r: 21, c: 0 }, e: { r: 21, c: 5 } },
      { s: { r: 23, c: 0 }, e: { r: 23, c: 5 } },
      { s: { r: 24, c: 0 }, e: { r: 24, c: 5 } },
      { s: { r: 26, c: 0 }, e: { r: 27, c: 3 } },
    ];

    const applyStyle = (range: string[], style: any) => {
      range.forEach((ref) => {
        if (ws[ref]) ws[ref].s = style;
      });
    };

    applyStyle(["A1", "B1", "C1", "D1", "A2", "B2", "C2", "D2"], darkHeaderStyle);
    applyStyle(["A4", "B4", "C4", "D4"], sectionStyle);
    applyStyle(["A5", "B5", "C5", "D5"], valueStyle);
    applyStyle(["A7", "A10", "A13", "A16", "A19", "A22", "A25"], sectionStyle);
    applyStyle(["A8", "B8", "C8", "D8", "E8", "A9", "B9", "C9", "D9", "E9"], labelStyle);
    applyStyle(["A11", "B11", "C11", "D11", "E11", "F11", "A12", "B12", "C12", "D12", "E12", "F12"], valueStyle);
    applyStyle(["A14", "B14", "A15", "B15", "C15", "D15", "E15", "F15"], labelStyle);
    applyStyle(["A17", "A18", "A20", "A21", "A23", "A24", "A26", "A27"], labelStyle);
    applyStyle(["A28", "B28", "C28", "D28"], accentStyle);
    applyStyle(["A29", "B29", "C29", "D29"], valueStyle);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ficha Baja");
    XLSX.writeFile(wb, `Ficha_Baja_${baja.NumeroFichaBaja || "export"}.xlsx`);
  };

  const handlePrintTicket = (baja: any) => {
    const checkedBox = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #2563eb;background:#2563eb;border-radius:3px;text-align:center;line-height:14px;color:white;font-size:10px;vertical-align:middle;">✔</span>`;
    const uncheckedBox = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #94a3b8;background:white;border-radius:3px;vertical-align:middle;"></span>`;

    const tipoBien = (baja.TipoBien || "").toLowerCase();
    const condicion = (baja.Condicion?.Condicion || "").toLowerCase();
    const estado = (baja.Estado?.EstadoBien || "").toLowerCase();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ficha de Baja ${baja.NumeroFichaBaja || "-"}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
          body { margin: 0; background: #fff; color: #1f2937; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .container { max-width: 100%; padding: 0; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #111827; padding-bottom:12px; margin-bottom:14px; }
          .header-left p { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:1px; }
          .header-left h2 { font-size:15px; font-weight:800; color:#111827; margin-top:4px; }
          .header-right { text-align:right; }
          .badge { display:inline-block; background:#f1f5f9; border:1px solid #cbd5e1; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:700; }
          .fecha { font-size:9px; color:#64748b; margin-top:6px; }
          .info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; margin-bottom:14px; }
          .label { display:block; font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; }
          .value { font-size:11px; color:#111827; font-weight:500; }
          .section-header { font-size:10px; font-weight:700; background:#1f2937; color:#fff; text-transform:uppercase; letter-spacing:0.5px; padding:5px 10px; border-radius:4px 4px 0 0; margin-top:10px; }
          .section-body { border:1px solid #e2e8f0; border-top:none; padding:10px; border-radius:0 0 4px 4px; margin-bottom:10px; }
          .check-row { display:flex; gap:18px; align-items:center; flex-wrap:wrap; }
          .check-item { display:flex; align-items:center; gap:6px; font-size:11px; }
          table { width:100%; border-collapse:collapse; font-size:10px; }
          th { background:#f1f5f9; font-weight:700; padding:6px 8px; border:1px solid #e2e8f0; text-align:left; }
          td { padding:6px 8px; border:1px solid #e2e8f0; }
          .two-col { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
          .text-block { min-height:50px; white-space:pre-wrap; font-size:11px; }
          .firmas { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:70px; text-align:center; }
          .firma-item { border-top:1px solid #64748b; padding-top:8px; font-size:10px; font-weight:700; color:#475569; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-left">
              <p>UNIDAD DE ESTADISTICA E INFORMATICA</p>
              <h2>FICHA DE BAJA DE BIENES</h2>
            </div>
            <div class="header-right">
              <span class="badge">Nº ${baja.NumeroFichaBaja || "-"}</span>
              <p class="fecha">Fecha: ${baja.FechaRegistro ? new Date(baja.FechaRegistro).toLocaleString() : "-"}</p>
            </div>
          </div>

          <div class="info-grid">
            <div><span class="label">Responsable del Bien</span><span class="value">${baja.Responsable || "-"}</span></div>
            <div><span class="label">Dependencia (Área)</span><span class="value">${baja.Dependencia || "-"}</span></div>
            <div><span class="label">Ambiente</span><span class="value">${baja.Ambiente || "-"}</span></div>
          </div>

          <div class="section-header">I. Tipo del Bien</div>
          <div class="section-body">
            <div class="check-row">
              <span class="check-item">${tipoBien.includes("informático") || tipoBien.includes("informatico") ? checkedBox : uncheckedBox} Informático</span>
              <span class="check-item">${tipoBien.includes("comunicación") || tipoBien.includes("comunicacion") ? checkedBox : uncheckedBox} Comunicación</span>
              <span class="check-item">${tipoBien.includes("biomédico") || tipoBien.includes("biomedico") ? checkedBox : uncheckedBox} Biomédico</span>
              <span class="check-item">${tipoBien.includes("mobiliario") ? checkedBox : uncheckedBox} Mobiliario</span>
            </div>
          </div>

          <div class="section-header">II. Detalle Técnico del Bien</div>
          <div class="section-body" style="padding:0;">
            <table>
              <thead><tr>
                <th>Bien / Descripción</th><th>Cód. Inventario</th><th>Cód. Patrimonial</th><th>Marca</th><th>Modelo</th><th>Nº Serie</th>
              </tr></thead>
              <tbody><tr>
                <td>${baja.Bien?.Descripcion || "-"}</td>
                <td>${baja.Bien?.CodigoInventario || "-"}</td>
                <td>${baja.Bien?.CodigoPatrimonial || "-"}</td>
                <td>${baja.Bien?.Marca?.Marca || "-"}</td>
                <td>${baja.Bien?.Modelo?.Modelo || "-"}</td>
                <td>${baja.Bien?.NumeroSerie || "-"}</td>
              </tr></tbody>
            </table>
          </div>

          <div class="two-col">
            <div>
              <div class="section-header">III. Condición del Bien</div>
              <div class="section-body"><div class="check-row">${condicion.includes("operativo") ? checkedBox : uncheckedBox} Operativo ${condicion.includes("inoperativo") ? checkedBox : uncheckedBox} Inoperativo</div></div>
            </div>
            <div>
              <div class="section-header">IV. Estado del Bien</div>
              <div class="section-body"><div class="check-row">${estado.includes("bueno") ? checkedBox : uncheckedBox} Bueno ${estado.includes("regular") ? checkedBox : uncheckedBox} Regular ${estado.includes("malo por reparar") ? checkedBox : uncheckedBox} Malo por reparar ${estado.includes("malo para baja") ? checkedBox : uncheckedBox} Malo para baja</div></div>
            </div>
          </div>

          <div class="section-header">V. Causal de Baja</div>
          <div class="section-body"><div class="text-block">${baja.CausalBaja || "-"}</div></div>

          <div class="section-header">VI. Fundamentación</div>
          <div class="section-body"><div class="text-block">${baja.Fundamentacion || "-"}</div></div>

          <div class="section-header">VII. Recomendación</div>
          <div class="section-body"><div class="text-block">${baja.Recomendacion || "-"}</div></div>

          <div class="firmas">
            <div class="firma-item">Especialista Validador</div>
            <div class="firma-item">Jefe de Área Usuaria</div>
            <div class="firma-item">Jefe de Control Patrimonial</div>
          </div>
        </div>

        <script>
          window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };
        </script>
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  };

  const handleNew = () => {
    const newFolio = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = sessionData?.user?.id ? String(sessionData.user.id) : "";

    setEditingBaja(null);
    setFormData({ IdCondicion: "", IdEstadoBien: "", Recomendacion: "", CausalBaja: "" });
    reset({
      NumeroFichaBaja: newFolio,
      UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
      Dependencia: "",
      IdBien: "",
      Prioridad: "",
      TipoBien: "",
      IdCondicion: "",
      IdEstadoBien: "",
      CausalBaja: "",
      Recomendacion: "",
      Observacion: "",
      Fundamentacion: "",
      IdUsuarioRegistro: userId,
    });
    setBienSearch("");
    setOpen(true);
  };

  const selectedBien = watch("IdBien");
  const selectedCondicion = watch("IdCondicion");
  const selectedEstado = watch("IdEstadoBien");

  useEffect(() => {
    if (sessionData?.user?.id) {
      setValue("IdUsuarioRegistro", String(sessionData.user.id));
    }
  }, [sessionData, setValue]);

  const selectedBienLabel = bienes?.find((b: any) => String(b.IdBien) === String(selectedBien))?.Descripcion || "Seleccionar Bien";
  const selectedCondicionLabel = condiciones?.find((c: any) => String(c.IdCondicion) === String(selectedCondicion))?.Condicion || "Seleccionar";
  const selectedEstadoLabel = estados?.find((e: any) => String(e.IdEstadoBien) === String(selectedEstado))?.EstadoBien || "Seleccionar";
  const selectedBienDetails = useMemo(
    () => bienes?.find((b: any) => String(b.IdBien) === String(selectedBien)) || null,
    [bienes, selectedBien]
  );

  const filteredBienes = useMemo(() => {
    const term = bienSearch.toLowerCase().trim();

    if (!bienes) return [];

    return (bienes as any[]).filter((bien: any) => {
      if (!term) return true;

      const haystack = [
        bien.Descripcion,
        bien.CodigoInventario,
        bien.CodigoPatrimonial,
        bien.NumeroSerie,
        bien.Marca?.Marca,
        bien.Modelo?.Modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [bienes, bienSearch]);

  const condicionCatalog = useMemo(
    () => (condiciones || []).filter((c: any) => CONDICION_OPTIONS.includes(c.Condicion)),
    [condiciones]
  );

  const estadoCatalog = useMemo(
    () => (estados || []).filter((e: any) => ESTADO_OPTIONS.includes(e.EstadoBien)),
    [estados]
  );

  const filteredBajas = useMemo(() => {
    const term = buscarText.toLowerCase().trim();

    if (!term) return bajas || [];

    return (bajas || []).filter((baja: any) => {
      const searchable = [
        baja.NumeroFichaBaja,
        baja.Bien?.Descripcion,
        baja.Bien?.CodigoPatrimonial,
        baja.UnidadOrganica,
        baja.Estado?.EstadoBien,
        baja.Fundamentacion,
        baja.Recomendacion,
        baja.Responsable,
        baja.CausalBaja,
        baja.UsuarioRegistro?.Nombres,
        baja.UsuarioRegistro?.Usuario,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [bajas, buscarText]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fichas de Baja de Bienes</h1>
          <p className="text-slate-500 text-sm">Gestiona la baja de bienes y equipos.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Ficha de Baja
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingBaja(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 p-0 shadow-2xl">
            <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-white px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-blue-700">Hospital Rezola</p>
                  <DialogHeader className="space-y-1 text-left">
                    <DialogTitle className="text-2xl font-semibold text-slate-900">
                      {editingBaja ? "Editar Ficha de Baja" : "Nueva Ficha de Baja"}
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-slate-500">Formulario institucional con diseño limpio, tarjetas y detalle técnico del activo.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">Estado</span>
                  <span className="font-semibold text-slate-900">{editingBaja ? "Edición" : "Nuevo registro"}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-6 sm:px-8">
              <input type="hidden" {...register("IdBien")} />
              <input type="hidden" {...register("Dependencia")} />
              <input type="hidden" {...register("Prioridad")} />
              <input type="hidden" {...register("TipoBien")} />
              <input type="hidden" {...register("IdCondicion")} />
              <input type="hidden" {...register("IdEstadoBien")} />
              <input type="hidden" {...register("CausalBaja")} />
              <input type="hidden" {...register("Recomendacion")} />
              <input type="hidden" {...register("Observacion")} />
              <input type="hidden" {...register("IdUsuarioRegistro")} />
              <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">1. Datos de la Ficha</h3>
                    <p className="text-sm text-slate-500">Número, unidad orgánica, responsable, dependencia y ambiente.</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Institucional</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-1.5 text-sm text-slate-700">
                    <span className="font-medium">N° Ficha Baja</span>
                    <Input {...register("NumeroFichaBaja", { required: "El número es requerido" })} className="h-11 rounded-xl border-slate-200 bg-white shadow-sm" readOnly />
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700">
                    <span className="font-medium">Unidad Orgánica</span>
                    <Input {...register("UnidadOrganica")} value="UNIDAD DE ESTADISTICA E INFORMATICA" readOnly className="h-11 rounded-xl border-slate-200 bg-slate-100 text-slate-500 shadow-sm" />
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700">
                    <span className="font-medium">Usuario Responsable</span>
                    <Input {...register("Responsable")} placeholder="Nombre del responsable" className="h-11 rounded-xl border-slate-200 bg-white shadow-sm" />
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700">
                    <span className="font-medium">Dependencia</span>
                    <Select value={watch("Dependencia") || ""} onValueChange={(val) => setValue("Dependencia", val)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder="Seleccione dependencia" /></SelectTrigger>
                      <SelectContent>
                        {DEPENDENCIA_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2 xl:col-span-1">
                    <span className="font-medium">Ambiente</span>
                    <Input {...register("Ambiente")} placeholder="Ej. Sala 01 / Oficina A" className="h-11 rounded-xl border-slate-200 bg-white shadow-sm" />
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">2. Selección del Activo</h3>
                  <p className="text-sm text-slate-500">Busque el bien y revise sus datos técnicos destacados.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
                    <span className="font-medium">Bien / Activo</span>
                    <Input
                      value={bienSearch}
                      onChange={(e) => setBienSearch(e.target.value)}
                      placeholder="Busque por descripción, inventario, serie o código patrimonial"
                      className="h-11 rounded-xl border-slate-200 bg-white shadow-sm"
                    />
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                      {filteredBienes.length > 0 ? (
                        filteredBienes.slice(0, 8).map((bien: any) => (
                          <button
                            key={bien.IdBien}
                            type="button"
                            onClick={() => {
                              setValue("IdBien", String(bien.IdBien));
                              setBienSearch(bien.Descripcion || "");
                            }}
                            className={`w-full border-b border-slate-100 px-3 py-3 text-left transition hover:bg-slate-50 ${String(watch("IdBien")) === String(bien.IdBien) ? "bg-blue-50" : ""}`}
                          >
                            <div className="text-sm font-semibold text-slate-800">{bien.Descripcion || "Sin descripción"}</div>
                            <div className="text-[11px] text-slate-500">{bien.CodigoInventario || "-"} • {bien.CodigoPatrimonial || "-"} • {bien.NumeroSerie || "-"}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-slate-500">No hay bienes que coincidan con la búsqueda.</div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">Seleccione un bien para que aparezca su detalle técnico en el resumen y en la vista de impresión.</p>
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700">
                    <span className="font-medium">Prioridad</span>
                    <Select value={watch("Prioridad") || ""} onValueChange={(val) => setValue("Prioridad", val)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-sm"><SelectValue placeholder="Seleccione prioridad" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Detalle del activo seleccionado</span>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-700">Resumen</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div><span className="font-semibold text-slate-500">Bien:</span> {selectedBienDetails?.Descripcion || selectedBienLabel || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Inventario:</span> {selectedBienDetails?.CodigoInventario || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Código Patrimonial:</span> {selectedBienDetails?.CodigoPatrimonial || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Marca:</span> {selectedBienDetails?.Marca?.Marca || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Modelo:</span> {selectedBienDetails?.Modelo?.Modelo || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Serie:</span> {selectedBienDetails?.NumeroSerie || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Dimensión:</span> {selectedBienDetails?.Dimension || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Color:</span> {selectedBienDetails?.Color || "-"}</div>
                    <div><span className="font-semibold text-slate-500">Fecha Adquisición:</span> {selectedBienDetails?.FechaAdquisicion || "-"}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">3. Tipo, Condición y Estado</h3>
                  <p className="text-sm text-slate-500">Selección visual por radio buttons para tipología y evaluación del bien.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Tipo de Bien</p>
                    <div className="space-y-2">{TIPO_BIEN_OPTIONS.map((item) => <label key={item} className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="tipoBien" value={item} checked={watch("TipoBien") === item} onChange={(e) => setValue("TipoBien", e.target.value)} className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />{item}</label>)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Condición del Bien</p>
                    <div className="space-y-2">{CONDICION_OPTIONS.map((item) => <label key={item} className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="condicionBien" value={item} checked={String(watch("IdCondicion") ?? formData.IdCondicion) === String(CONDICION_OPTIONS.indexOf(item) + 1)} onChange={() => { const val = String(CONDICION_OPTIONS.indexOf(item) + 1); handleSelectField("IdCondicion", val); }} className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />{item}</label>)}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Estado del Bien</p>
                    <div className="space-y-2">{ESTADO_OPTIONS.map((item, idx) => <label key={item} className="flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="estadoBien" value={String(idx + 1)} checked={String(watch("IdEstadoBien") ?? formData.IdEstadoBien) === String(idx + 1)} onChange={(e) => handleSelectField("IdEstadoBien", e.target.value)} className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />{item}</label>)}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">4. Evaluación y Causal</h3>
                  <p className="text-sm text-slate-500">Causal, fundamentación y recomendación de baja institucional.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
                    <span className="font-medium">Causal de Baja</span>
                    <Select value={formData.CausalBaja || watch("CausalBaja") || ""} onValueChange={(val) => handleSelectField("CausalBaja", val)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-sm"><SelectValue placeholder="Seleccione causal" /></SelectTrigger>
                      <SelectContent>{CAUSAL_BAJA_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
                    <span className="font-medium">Fundamentación</span>
                    <Textarea {...register("Fundamentacion")} placeholder="Explique el motivo técnico y administrativo de la baja" className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50 shadow-sm" />
                  </label>
                  <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
                    <span className="font-medium">Recomendación</span>
                    <Select value={formData.Recomendacion || watch("Recomendacion") || ""} onValueChange={(val) => handleSelectField("Recomendacion", val)}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 shadow-sm"><SelectValue placeholder="Seleccione recomendación" /></SelectTrigger>
                      <SelectContent>{RECOMENDACION_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                </div>
              </section>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Button>
                <Button type="submit" className="h-11 rounded-xl bg-[#b91c1c] text-white shadow-lg shadow-red-900/15 hover:bg-[#991b1b]" disabled={mutation.isPending}>{mutation.isPending ? "Guardando..." : "Guardar Ficha de Baja"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar ficha de baja..."
            value={buscarText}
            onChange={(e) => setBuscarText(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando fichas de baja...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Nº Ficha</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Bien / Equipo</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Cód. Patrimonial</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Área Usuaria</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Condición</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Estado</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Causal</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap">Responsable</th>
                  <th className="px-4 py-4 font-semibold whitespace-nowrap text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBajas.map((baja: any) => (
                  <tr key={baja.IdBaja} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors align-top">
                    <td className="px-4 py-4 font-semibold text-red-600 whitespace-nowrap">{baja.NumeroFichaBaja || "-"}</td>
                    <td className="px-4 py-4 max-w-[220px] text-slate-700">
                      <div className="truncate" title={baja.Bien?.Descripcion || "-"}>{baja.Bien?.Descripcion || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{baja.Bien?.CodigoPatrimonial || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{baja.UnidadOrganica || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getCondicionBadgeClass(baja.Condicion?.Condicion)}`}>
                        {baja.Condicion?.Condicion || "Sin condición"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClass(baja.Estado?.EstadoBien)}`}>
                        {baja.Estado?.EstadoBien || "Sin estado"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{baja.CausalBaja || "-"}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-600">{baja.Responsable || "-"}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => handleView(baja)}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(baja)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(baja.IdBaja)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                          onClick={() => {
                            setSelectedFicha(baja);
                            setPrintOpen(true);
                          }}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBajas.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-4 text-center text-slate-500">
                      No hay fichas de baja registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-white sm:max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-xl font-bold text-slate-800">Detalle de ficha de baja</DialogTitle>
          </DialogHeader>

          {selectedFicha && (
            <div id="printable-baja" className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 text-slate-800 print:border-none print:p-0">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">UNIDAD DE ESTADISTICA E INFORMATICA</p>
                  <h2 className="mt-1 text-base font-extrabold text-slate-800">FICHA DE BAJA DE BIENES</h2>
                </div>
                <div className="text-right">
                  <p className="inline-block rounded border bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">Nº {selectedFicha.NumeroFichaBaja || "-"}</p>
                  <p className="mt-1.5 text-[10px] text-slate-500">Fecha: {selectedFicha.FechaRegistro ? new Date(selectedFicha.FechaRegistro).toLocaleString() : "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded border bg-slate-50 p-3 text-[11px] text-slate-700">
                <div><span className="block font-bold text-slate-500">RESPONSABLE DEL BIEN</span><span className="text-xs font-medium text-slate-800">{selectedFicha.Responsable || "-"}</span></div>
                <div><span className="block font-bold text-slate-500">DEPENDENCIA (ÁREA)</span><span className="text-xs font-medium text-slate-800">{selectedFicha.Dependencia || "-"}</span></div>
                <div><span className="block font-bold text-slate-500">AMBIENTE</span><span className="text-xs font-medium text-slate-800">{selectedFicha.Ambiente || "-"}</span></div>
              </div>

              <div>
                <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">I. Tipo del Bien</h3>
                <div className="flex flex-wrap gap-6 rounded-b border border-t-0 p-3 text-xs">
                  {['Informático','Comunicación','Biomédico','Mobiliario','Eléctricos/electrónicos/electromecánico','Mobiliario Clínico'].map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input type="checkbox" checked={(selectedFicha.TipoBien || "").toLowerCase().includes(item.toLowerCase().replace(/[^a-z]/g, ''))} readOnly className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">II. Detalle Técnico del Bien</h3>
                <div className="overflow-hidden rounded-b border border-t-0">
                  <table className="w-full border-collapse text-[11px] text-left">
                    <thead>
                      <tr className="border-b bg-slate-100">
                        <th className="border-r p-2 font-bold">Bien / Descripción</th>
                        <th className="border-r p-2 font-bold">Código Inventario</th>
                        <th className="border-r p-2 font-bold">Código Patrimonial</th>
                        <th className="border-r p-2 font-bold">Marca</th>
                        <th className="border-r p-2 font-bold">Modelo</th>
                        <th className="p-2 font-bold">Nº Serie</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border-r border-b p-2">{selectedFicha.Bien?.Descripcion || "-"}</td>
                        <td className="border-r border-b p-2">{selectedFicha.Bien?.CodigoInventario || selectedBienDetails?.CodigoInventario || "-"}</td>
                        <td className="border-r border-b p-2">{selectedFicha.Bien?.CodigoPatrimonial || "-"}</td>
                        <td className="border-r border-b p-2">{selectedFicha.Bien?.Marca?.Marca || selectedBienDetails?.Marca?.Marca || "-"}</td>
                        <td className="border-r border-b p-2">{selectedFicha.Bien?.Modelo?.Modelo || selectedBienDetails?.Modelo?.Modelo || "-"}</td>
                        <td className="border-b p-2">{selectedFicha.Bien?.NumeroSerie || selectedBienDetails?.NumeroSerie || "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">III. Condición del Bien</h3>
                  <div className="flex flex-wrap gap-6 rounded-b border border-t-0 p-3 text-xs">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={(selectedFicha.Condicion?.Condicion || selectedCondicionLabel || "").toUpperCase().includes("OPERATIVO")} readOnly className="rounded text-blue-600 pointer-events-none" /><span>Operativo</span></label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={(selectedFicha.Condicion?.Condicion || selectedCondicionLabel || "").toUpperCase().includes("INOPERATIVO")} readOnly className="rounded text-blue-600 pointer-events-none" /><span>Inoperativo</span></label>
                  </div>
                </div>
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">IV. Estado del Bien</h3>
                  <div className="flex flex-wrap gap-4 rounded-b border border-t-0 p-3 text-[11px]">
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedFicha.Estado?.EstadoBien || selectedEstadoLabel || "").toUpperCase().includes("BUENO")} readOnly className="rounded text-blue-600 pointer-events-none" /><span>Bueno</span></label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedFicha.Estado?.EstadoBien || selectedEstadoLabel || "").toUpperCase().includes("REGULAR")} readOnly className="rounded text-blue-600 pointer-events-none" /><span>Regular</span></label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedFicha.Estado?.EstadoBien || selectedEstadoLabel || "").toUpperCase().includes("MALO POR REPARAR")} readOnly className="rounded text-blue-600 pointer-events-none" /><span>Malo por reparar</span></label>
                    <label className="flex items-center gap-1.5"><input type="checkbox" checked={(selectedFicha.Estado?.EstadoBien || selectedEstadoLabel || "").toUpperCase().includes("MALO PARA BAJA")} readOnly className="rounded text-blue-600 pointer-events-none" /><span>Malo para baja</span></label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">V. Causal de Baja</h3>
                  <div className="min-h-[50px] rounded-b border border-t-0 p-3 text-xs whitespace-pre-wrap">{selectedFicha.CausalBaja || "Ninguna"}</div>
                </div>
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">VI. Fundamentación</h3>
                  <div className="min-h-[50px] rounded-b border border-t-0 p-3 text-xs whitespace-pre-wrap">{selectedFicha.Fundamentacion || "Ninguna"}</div>
                </div>
                <div>
                  <h3 className="rounded-t bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">VII. Recomendación</h3>
                  <div className="min-h-[50px] rounded-b border border-t-0 p-3 text-xs whitespace-pre-wrap">{selectedFicha.Recomendacion || "Ninguna"}</div>
                </div>
              </div>

              <div className="pt-16 grid grid-cols-3 gap-6 text-center text-[10px] uppercase font-bold text-slate-700">
                <div className="flex h-24 flex-col items-center justify-end"><div className="mb-2 w-4/5 border-t border-slate-900"></div><span>Especialista Validador</span><span className="mt-1 text-[9px] font-normal normal-case text-slate-500">{selectedFicha.Validador || "-"}</span></div>
                <div className="flex h-24 flex-col items-center justify-end"><div className="mb-2 w-4/5 border-t border-slate-900"></div><span>Jefe de Área Usuaria</span><span className="mt-1 text-[9px] font-normal normal-case text-slate-500">{selectedFicha.JefeArea || "-"}</span></div>
                <div className="flex h-24 flex-col items-center justify-end"><div className="mb-2 w-4/5 border-t border-slate-900"></div><span>Jefe de Control Patrimonial</span><span className="mt-1 text-[9px] font-normal normal-case text-slate-500">{selectedFicha.JefePatrimonial || "-"}</span></div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] text-slate-400 print:mt-12 print:text-slate-500">
                <span>SISTEMA DE SOPORTE Y BAJA DE BIENES</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 print:hidden">
            <Button variant="outline" onClick={() => setDetailOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="bg-white sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Exportar / Imprimir Ficha de Baja</DialogTitle>
            <p className="text-sm text-slate-600">Elige cómo deseas obtener la ficha de baja seleccionada.</p>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button
              type="button"
              onClick={() => {
                setPrintOpen(false);
                if (selectedFicha) handlePrintTicket(selectedFicha);
              }}
              className="h-24 flex flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-slate-800"
            >
              <Printer className="h-8 w-8" />
              <span className="text-base font-semibold">Imprimir PDF</span>
            </Button>

            <Button
              type="button"
              onClick={() => {
                setPrintOpen(false);
                if (selectedFicha) handleExportSingleExcel(selectedFicha);
              }}
              className="h-24 flex flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-emerald-700"
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span className="text-base font-semibold">Descargar Excel</span>
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setPrintOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}