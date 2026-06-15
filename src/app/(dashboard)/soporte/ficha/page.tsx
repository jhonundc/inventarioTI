"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import {
  Edit,
  FileSearch,
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Power,
  Trash2,
  Printer,
} from "lucide-react";

import {
  getAreas,
  getBienes,
  getCondiciones,
  getEstados,
  getPrioridades,
  getTiposBien,
} from "@/app/actions/catalogs";

type Bien = {
  IdBien: number;
  CodigoInventario: string;
  CodigoPatrimonial: string;
  Descripcion: string;
  NumeroSerie: string;
  IdArea: number | null;
  IdMarca: number | null;
  IdModelo: number | null;
  IdCondicion: number | null;
  IdEstadoBien: number | null;
  Area?: {
    NombreArea: string;
  };
  Marca?: {
    Marca: string;
  };
  Modelo?: {
    Modelo: string;
  };
  Condicion?: {
    Condicion: string;
  };
  Estado?: {
    EstadoBien: string;
  };
};

type Condicion = {
  IdCondicion: number;
  Condicion: string | null;
};

type Estado = {
  IdEstadoBien: number;
  EstadoBien: string | null;
};

type Prioridad = {
  IdPrioridad: number;
  NombrePrioridad: string | null;
};

type Area = {
  IdArea: number;
  NombreArea: string;
};

type TipoBien = {
  IdTipoBien: number;
  TipoBien: string;
};

const fetchFichas = async () => {
  const res = await fetch("/api/soporte/ficha");

  if (!res.ok) {
    throw new Error("Error al cargar las fichas");
  }

  return res.json();
};

const fetchBienes = async () => {
  const res = await fetch("/api/bienes");

  if (!res.ok) {
    throw new Error("Error al cargar los bienes");
  }

  return res.json();
};

export default function FichaSoportePage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingFicha, setEditingFicha] = useState<any>(null);
  const [verOpen, setVerOpen] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<any>(null);

  const [printActionOpen, setPrintActionOpen] = useState(false);
  const [selectedFichaForPrint, setSelectedFichaForPrint] = useState<any>(null);

  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");

  const [buscarOpen, setBuscarOpen] = useState(false);
  const [buscarText, setBuscarText] = useState("");
  const [buscarResultados, setBuscarResultados] = useState<any[]>([]);
  const [busquedaIdFicha, setBusquedaIdFicha] = useState("");

  const [openNewAreaModal, setOpenNewAreaModal] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");

  const [openBienModal, setOpenBienModal] = useState(false);

  const [newBien, setNewBien] = useState({
    codigoInventario: "",
    codigoPatrimonial: "",
    descripcion: "",
    numeroSerie: "",
    marca: "",
    modelo: "",
    idArea: "",
  });

  // Form state
  const [tipoBien, setTipoBien] = useState<string>("");
  const [condicionBien, setCondicionBien] = useState<string>("");
  const [estadoBienOptions, setEstadoBienOptions] = useState<Estado[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>();

  // =========================
  // QUERIES
  // =========================

  const {
    data: fichas,
    isLoading,
  } = useQuery({
    queryKey: ["fichasSoporte"],
    queryFn: fetchFichas,
  });

  const {
    data: bienes,
  } = useQuery({
    queryKey: ["bienes"],
    queryFn: fetchBienes,
  });

  const {
    data: condiciones,
  } = useQuery<Condicion[]>({
    queryKey: ["condicionesFichas"],
    queryFn: async () => getCondiciones(),
  });

  const {
    data: estados,
  } = useQuery<Estado[]>({
    queryKey: ["estadosFichas"],
    queryFn: async () => getEstados(),
  });

  const {
    data: prioridades,
  } = useQuery<Prioridad[]>({
    queryKey: ["prioridadesFichas"],
    queryFn: async () => getPrioridades(),
  });

  const {
    data: areas,
  } = useQuery<Area[]>({
    queryKey: ["areas"],
    queryFn: async () => getAreas(),
  });

  const {
    data: tiposBien,
  } = useQuery<TipoBien[]>({
    queryKey: ["tiposBien"],
    queryFn: async () => getTiposBien(),
  });

  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
  });

  const selectedAreaName = watch("Dependencia");
  const filteredBienes = useMemo(() => {
    if (!bienes) return [];
    if (!selectedAreaName) return bienes;
    return bienes.filter((bien: any) => bien.Area?.NombreArea === selectedAreaName);
  }, [bienes, selectedAreaName]);

  const lookupFilteredBienes = useMemo(() => {
    let list = filteredBienes;
    if (lookupSearch.trim()) {
      const term = lookupSearch.toLowerCase();
      list = list.filter((bien: any) => {
        return (
          (bien.Descripcion?.toLowerCase() || "").includes(term) ||
          (bien.NumeroSerie?.toLowerCase() || "").includes(term) ||
          (bien.CodigoPatrimonial?.toLowerCase() || "").includes(term) ||
          (bien.CodigoInventario?.toLowerCase() || "").includes(term) ||
          (bien.Marca?.Marca?.toLowerCase() || "").includes(term) ||
          (bien.Modelo?.Modelo?.toLowerCase() || "").includes(term)
        );
      });
    }
    return list;
  }, [filteredBienes, lookupSearch]);

  // =========================
  // EFECTOS
  // =========================

  // Limpiar IdBien si cambia la Dependencia y el Bien seleccionado no pertenece al área
  useEffect(() => {
    if (!bienes || !selectedAreaName) return;
    const currentBienId = watch("IdBien");
    if (!currentBienId) return;

    const currentBien = bienes.find((b: any) => String(b.IdBien) === String(currentBienId));
    if (currentBien && currentBien.Area?.NombreArea !== selectedAreaName) {
      setValue("IdBien", "");
    }
  }, [selectedAreaName, bienes, setValue, watch]);

  // Auto-completar Dependencia al seleccionar bien
  const selectedBienId = watch("IdBien");
  useEffect(() => {
    if (!selectedBienId || !bienes || editingFicha) return;

    const selectedBien = bienes.find((b: any) => String(b.IdBien) === String(selectedBienId));
    if (selectedBien) {
      if (selectedBien.Area?.NombreArea) {
        setValue("Dependencia", selectedBien.Area.NombreArea);
      }
    }
  }, [selectedBienId, bienes, editingFicha, setValue]);

  // Update estadoBienOptions based on condicionBien
  useEffect(() => {
    if (!estados) return;

    let filteredEstados: Estado[] = [];
    const condUpper = (condicionBien || "").toUpperCase();

    if (condUpper === "OPERATIVO") {
      filteredEstados = estados.filter(
        (e) => e.EstadoBien?.toUpperCase() === "BUENO" || e.EstadoBien?.toUpperCase() === "REGULAR"
      );
    } else if (condUpper === "INOPERATIVO") {
      filteredEstados = estados.filter(
        (e) => e.EstadoBien?.toUpperCase() === "REPARAR" || e.EstadoBien?.toUpperCase() === "BAJA"
      );
    } else {
      filteredEstados = estados;
    }

    setEstadoBienOptions(filteredEstados);
  }, [condicionBien, estados]);

  // =========================
  // FILTRO DE BUSQUEDA
  // =========================

  useEffect(() => {
    if (!buscarText.trim()) {
      setBuscarResultados([]);
      return;
    }

    const texto = buscarText.toLowerCase();

    const resultados =
      fichas?.filter((ficha: any) => {
        const invCode = (ficha?.Bien?.CodigoInventario || "").toLowerCase();
        const patCode = (ficha?.Bien?.CodigoPatrimonial || "").toLowerCase();
        const serial = (ficha?.Bien?.NumeroSerie || "").toLowerCase();
        const numFicha = (ficha?.NumeroFicha || "").toLowerCase();
        const resp = (ficha?.Responsable || "").toLowerCase();
        const dep = (ficha?.Dependencia || "").toLowerCase();
        const amb = (ficha?.Ambiente || "").toLowerCase();
        const prob = (ficha?.DescripcionProblema || "").toLowerCase();
        const trabajos = (ficha?.TrabajosRealizados || "").toLowerCase();
        const diag = (ficha?.Diagnostico || "").toLowerCase();
        const rec = (ficha?.Recomendacion || "").toLowerCase();

        return (
          numFicha.includes(texto) ||
          invCode.includes(texto) ||
          patCode.includes(texto) ||
          serial.includes(texto) ||
          resp.includes(texto) ||
          dep.includes(texto) ||
          amb.includes(texto) ||
          prob.includes(texto) ||
          trabajos.includes(texto) ||
          diag.includes(texto) ||
          rec.includes(texto)
        );
      }) || [];

    setBuscarResultados(resultados);
  }, [buscarText, fichas]);

  // =========================
  // MUTATION CREAR/EDITAR/ELIMINAR
  // =========================

  const saveFichaMutation = useMutation({
    mutationFn: async (data: any) => {
      const bodyData = { ...data };
      if (editingFicha) {
        bodyData.IdSoporte = editingFicha.IdSoporte;
      }

      const res = await fetch("/api/soporte/ficha", {
        method: editingFicha ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar ficha");
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fichasSoporte"],
      });

      reset();
      setEditingFicha(null);
      setOpen(false);
    },
  });

  const deleteFichaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/soporte/ficha?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar ficha");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fichasSoporte"],
      });
    },
  });

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de eliminar esta ficha de soporte?")) {
      try {
        await deleteFichaMutation.mutateAsync(id);
      } catch (error) {
        alert("Error al eliminar la ficha");
      }
    }
  };

  // =========================
  // EXPORT TO EXCEL
  // =========================

  const exportToExcel = () => {
    const listToExport = buscarText ? buscarResultados : fichas || [];
    if (listToExport.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    import("xlsx").then((XLSX) => {
      const exportData = listToExport.map((ficha: any) => ({
        "Nº Ficha": ficha.NumeroFicha || "",
        "Unidad Orgánica": ficha.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA",
        "Fecha Registro": ficha.FechaRegistro ? new Date(ficha.FechaRegistro).toLocaleString() : "",
        "Responsable": ficha.Responsable || "",
        "Dependencia (Área)": ficha.Dependencia || "",
        "Ambiente": ficha.Ambiente || "",
        "Tipo de Bien": ficha.TipoBien || "",
        "Código Inventario": ficha.Bien?.CodigoInventario || "",
        "Código Patrimonial": ficha.Bien?.CodigoPatrimonial || "",
        "Descripción del Bien": ficha.Bien?.Descripcion || "",
        "Marca": ficha.Bien?.Marca?.Marca || "",
        "Modelo": ficha.Bien?.Modelo?.Modelo || "",
        "Nº Serie": ficha.Bien?.NumeroSerie || "",
        "Condición": ficha.Condicion?.Condicion || "",
        "Estado": ficha.Estado?.EstadoBien || "",
        "Trabajos Realizados": ficha.TrabajosRealizados || "",
        "Diagnóstico": ficha.Diagnostico || "",
        "Recomendaciones": ficha.Recomendacion || "",
        "Firma Soporte": ficha.FirmaSoporte || "",
        "Firma Jefe": ficha.FirmaJefeUnidad || "",
        "Firma Usuario": ficha.FirmaAreaUsuario || "",
        "Registrado Por": ficha.UsuarioSoporte?.Nombres || ""
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fichas Soporte");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Fichas_Soporte_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  const handleExportSingleExcel = async (ficha: any) => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ficha Soporte");

    worksheet.columns = [
      { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }
    ];

    const applyHeaderStyle = (cell: any) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    };
    
    const applyCellStyle = (cell: any) => {
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    };

    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = "FICHA DE SOPORTE TÉCNICO";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Nº Ficha: ${ficha.NumeroFicha || ""} | Fecha: ${ficha.FechaRegistro ? new Date(ficha.FechaRegistro).toLocaleString() : ""}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    worksheet.getCell('A2').font = { size: 10 };

    worksheet.mergeCells('A4:B4'); worksheet.getCell('A4').value = "RESPONSABLE DEL BIEN";
    worksheet.mergeCells('C4:D4'); worksheet.getCell('C4').value = "DEPENDENCIA (ÁREA)";
    worksheet.mergeCells('E4:F4'); worksheet.getCell('E4').value = "AMBIENTE";
    ['A4', 'C4', 'E4'].forEach(ref => applyHeaderStyle(worksheet.getCell(ref)));

    worksheet.mergeCells('A5:B5'); worksheet.getCell('A5').value = ficha.Responsable || "-";
    worksheet.mergeCells('C5:D5'); worksheet.getCell('C5').value = ficha.Dependencia || "-";
    worksheet.mergeCells('E5:F5'); worksheet.getCell('E5').value = ficha.Ambiente || "-";
    ['A5', 'C5', 'E5'].forEach(ref => applyCellStyle(worksheet.getCell(ref)));

    worksheet.mergeCells('A7:F7');
    const tipoHeader = worksheet.getCell('A7');
    tipoHeader.value = "I. TIPO DEL BIEN";
    applyHeaderStyle(tipoHeader);
    
    worksheet.mergeCells('A8:F8');
    const tipoValue = worksheet.getCell('A8');
    tipoValue.value = ficha.TipoBien || "-";
    applyCellStyle(tipoValue);

    worksheet.mergeCells('A10:F10');
    const detalleHeader = worksheet.getCell('A10');
    detalleHeader.value = "II. DETALLE TÉCNICO DEL BIEN";
    applyHeaderStyle(detalleHeader);

    const headersDetalle = ["Código Inventario", "Código Patrimonial", "Bien / Descripción", "Marca", "Modelo", "Nº Serie"];
    headersDetalle.forEach((header, index) => {
      const cell = worksheet.getCell(11, index + 1);
      cell.value = header;
      applyHeaderStyle(cell);
    });

    const valuesDetalle = [
      ficha.Bien?.CodigoInventario || "-",
      ficha.Bien?.CodigoPatrimonial || "-",
      ficha.Bien?.Descripcion || "-",
      ficha.Bien?.Marca?.Marca || "-",
      ficha.Bien?.Modelo?.Modelo || "-",
      ficha.Bien?.NumeroSerie || "-"
    ];
    valuesDetalle.forEach((val, index) => {
      const cell = worksheet.getCell(12, index + 1);
      cell.value = val;
      applyCellStyle(cell);
    });

    worksheet.mergeCells('A14:C14'); worksheet.getCell('A14').value = "III. CONDICIÓN DEL BIEN";
    worksheet.mergeCells('D14:F14'); worksheet.getCell('D14').value = "IV. ESTADO DEL BIEN";
    ['A14', 'D14'].forEach(ref => applyHeaderStyle(worksheet.getCell(ref)));

    worksheet.mergeCells('A15:C15'); worksheet.getCell('A15').value = ficha.Condicion?.Condicion || "-";
    worksheet.mergeCells('D15:F15'); worksheet.getCell('D15').value = ficha.Estado?.EstadoBien || "-";
    ['A15', 'D15'].forEach(ref => applyCellStyle(worksheet.getCell(ref)));

    worksheet.mergeCells('A17:F17'); worksheet.getCell('A17').value = "V. TRABAJOS REALIZADOS";
    applyHeaderStyle(worksheet.getCell('A21'));
    worksheet.mergeCells('A18:F19'); worksheet.getCell('A18').value = ficha.TrabajosRealizados || "-";
    applyCellStyle(worksheet.getCell('A18'));

    worksheet.mergeCells('A21:C21'); worksheet.getCell('A21').value = "VI. DIAGNÓSTICO";
    worksheet.mergeCells('D21:F21'); worksheet.getCell('D21').value = "VII. RECOMENDACIÓN";
    ['A25', 'D25'].forEach(ref => applyHeaderStyle(worksheet.getCell(ref)));

    worksheet.mergeCells('A22:C23'); worksheet.getCell('A22').value = ficha.Diagnostico || "-";
    worksheet.mergeCells('D22:F23'); worksheet.getCell('D22').value = ficha.Recomendacion || "-";
    ['A22', 'D22'].forEach(ref => applyCellStyle(worksheet.getCell(ref)));

    worksheet.mergeCells('A25:B25'); worksheet.getCell('A25').value = "";
    worksheet.mergeCells('C25:D25'); worksheet.getCell('C25').value = "";
    worksheet.mergeCells('E25:F25'); worksheet.getCell('E25').value = "";

    // Filas 26-30 vacías para espacio de firma
    for (let r = 26; r <= 30; r++) {
      worksheet.mergeCells(`A${r}:B${r}`);
      worksheet.mergeCells(`C${r}:D${r}`);
      worksheet.mergeCells(`E${r}:F${r}`);
    }

    // Líneas de firma en fila 31
    worksheet.mergeCells('A31:B31'); worksheet.getCell('A31').value = "________________________";
    worksheet.mergeCells('C31:D31'); worksheet.getCell('C31').value = "________________________";
    worksheet.mergeCells('E31:F31'); worksheet.getCell('E31').value = "________________________";
    ['A31', 'C31', 'E31'].forEach(ref => {
      const cell = worksheet.getCell(ref);
      cell.font = { size: 10 };
      cell.alignment = { horizontal: 'center' };
    });

    // Títulos de firma en fila 32
    worksheet.mergeCells('A32:B32'); worksheet.getCell('A32').value = "Responsable de Soporte Técnico";
    worksheet.mergeCells('C32:D32'); worksheet.getCell('C32').value = "Jefe(e) Unidad Estadística e Informática";
    worksheet.mergeCells('E32:F32'); worksheet.getCell('E32').value = "Área Usuaria";
    ['A32', 'C32', 'E32'].forEach(ref => {
      const cell = worksheet.getCell(ref);
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: 'center' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const data = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Ficha_${ficha.NumeroFicha}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setPrintActionOpen(false);
  };

  const handlePrintTicket = (ficha: any) => {
    setPrintActionOpen(false);

    const checkedBox = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #2563eb;background:#2563eb;border-radius:3px;text-align:center;line-height:14px;color:white;font-size:10px;vertical-align:middle;">✔</span>`;
    const uncheckedBox = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #94a3b8;background:white;border-radius:3px;vertical-align:middle;"></span>`;

    const tipoBien = (ficha.TipoBien || "").toLowerCase();
    const condicion = (ficha.Condicion?.Condicion || "").toLowerCase();
    const estado = (ficha.Estado?.EstadoBien || "").toLowerCase();

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ficha de Soporte Técnico</title>

<style>

@page{
    size: A4;
    margin: 20mm;
}

*{
    box-sizing: border-box;
}

body{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color:#000;
    margin:0;
    padding:0;
}

.container{
    width:100%;
    max-width:768px;
    margin:0 auto;
    padding:0 10px;
}

.page-header{
    position:relative;
    padding-top:100px;
    margin-bottom:8px;
}

.corner-icon{
    position:absolute;
    display:flex;
    align-items:center;
    justify-content:center;
}

.top-left{
    width:90px;
    height:90px;
    top:0;
    left:0;
}

.top-right{
    width:80px;
    height:80px;
    top:0;
    right:0;
}

.corner-icon img{
    width:100%;
    height:100%;
    object-fit:contain;
}

.titulo{
    text-align:center;
    font-weight:bold;
    font-size:18px;
    margin-bottom:10px;
    line-height:1.1;
}

table{
    width:100%;
    border-collapse:collapse;
    line-height:1.2;
}

td,
th{
    border:1px solid #000;
    padding:4px;
    vertical-align:middle;
}

.seccion{
    margin-top:14px;
    margin-bottom:5px;
    font-weight:bold;
    line-height:1.2;
}

.recuadro{
    border:2px solid #000;
    min-height:70px;
    padding:12px;
    line-height:1.2;
}

.firmas{
    margin-top:42px;
    display:flex;
    justify-content:space-between;
    gap:18px;
}

.firma{
    width:30%;
    text-align:center;
}

.firma-line{
    border-top:1px solid #000;
    margin-top:24px;
    padding-top:6px;
    min-height:72px;
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    gap:4px;
}

.firma-text{
    font-weight:bold;
    font-size:10px;
    line-height:1.2;
}

.fecha{
    width:120px;
    text-align:center;
    font-weight:bold;
    line-height:1.2;
}

.sin-borde{
    border:none !important;
}

.caja{
    width:18px;
    height:18px;
    border:2px solid #000;
    display:inline-block;
    vertical-align:middle;
    margin-left:6px;
}

.texto-centro{
    text-align:center;
}

.recuadro{
    border:2px solid #000;
    min-height:80px;
    padding:15px;
}

.firmas{
    margin-top:60px;
    display:flex;
    justify-content:space-between;
    gap:20px;
}

.firma{
    width:30%;
    text-align:center;
}

.linea{
    border-top:1px solid #000;
    padding-top:5px;
}

.fecha{
    width:120px;
    text-align:center;
    font-weight:bold;
}

.footer{
    margin-top:40px;
}

@media print{

    .no-print{
        display:none !important;
    }

    body{
        margin:0;
    }

    .container{
        width:100%;
    }
}

</style>
</head>

<body>

<div class="container">

    <div class="page-header">
        <div class="corner-icon top-left"><img src="/logo1.png" alt="Logo 1" /></div>
        <div class="corner-icon top-right"><img src="/logo2.png" alt="Logo 2" /></div>
        <div class="titulo">
            FICHA DE SOPORTE TECNICO
        </div>
    </div>

    <!-- ENCABEZADO -->

    <table>
        <tr>

            <td style="width:20%;">
                <b>Unidad Organica :</b>
            </td>

            <td>${ficha.UnidadOrganica || ''}</td>

            <td class="fecha">
                FECHA
                <br><br>
                ${ficha.FechaRegistro ? new Date(ficha.FechaRegistro).toLocaleDateString() : ''}
            </td>

        </tr>
    </table>

    <!-- RESPONSABLE -->

    <div class="seccion">
        USUARIO RESPONSABLE DEL BIEN:
    </div>

    <table>

        <tr>
            <td style="width:15%;">
                <b>Responsable:</b>
            </td>
            <td>${ficha.Responsable || ''}</td>
        </tr>

        <tr>
            <td>
                <b>Dependencia:</b>
            </td>
            <td>${ficha.Dependencia || ''}</td>
        </tr>

        <tr>
            <td>
                <b>Ambiente:</b>
            </td>
            <td>${ficha.Ambiente || ''}</td>
        </tr>

    </table>

    <!-- TIPO DE BIEN -->

    <div class="seccion">
        I. TIPO DEL BIEN
    </div>

    <table>
        <tr>

            <td class="sin-borde">
                a) Informático
                <span class="caja">${tipoBien === 'informático' || tipoBien === 'informatico' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                b) Comunicación
                <span class="caja">${tipoBien === 'comunicación' || tipoBien === 'comunicacion' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                c) Eléctrico
                <span class="caja">${tipoBien === 'eléctrico' || tipoBien === 'electrico' ? '✔' : ''}</span>
            </td>

        </tr>
    </table>

    <!-- DETALLE TECNICO -->

    <div class="seccion">
        II. DETALLE TECNICO
    </div>

    <table>

        <tr>

            <th rowspan="2" style="width:16%;">
                CODIGO DE INVENTARIO
            </th>

            <th rowspan="2" style="width:16%;">
                CODIGO PATRIMONIAL
            </th>

            <th rowspan="2" style="width:22%;">
                DESCRIPCION
            </th>

            <th colspan="3">
                DETALLE TECNICO
            </th>

        </tr>

        <tr>

            <th>MARCA</th>
            <th>MODELO</th>
            <th>SERIE</th>

        </tr>

        <tr>

            <td style="height:50px;">${ficha.Bien?.CodigoInventario || ''}</td>
            <td>${ficha.Bien?.CodigoPatrimonial || ''}</td>
            <td>${ficha.Bien?.Descripcion || ''}</td>
            <td>${ficha.Bien?.Marca?.Marca || ''}</td>
            <td>${ficha.Bien?.Modelo?.Modelo || ''}</td>
            <td>${ficha.Bien?.NumeroSerie || ''}</td>

        </tr>

    </table>

    <!-- CONDICION -->

    <div class="seccion">
        III. CONDICION DEL BIEN
    </div>

    <table>

        <tr>
            <td class="sin-borde">
                Operativo
                <span class="caja">${condicion === 'operativo' ? '✔' : ''}</span>
            </td>
        </tr>

        <tr>
            <td class="sin-borde">
                Inoperativo
                <span class="caja">${condicion === 'inoperativo' ? '✔' : ''}</span>
            </td>
        </tr>

    </table>

    <!-- ESTADO -->

    <div class="seccion">
        IV. ESTADO DEL BIEN
    </div>

    <table>

        <tr>

            <td class="sin-borde">
                Bueno
                <span class="caja">${estado === 'bueno' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                Regular
                <span class="caja">${estado === 'regular' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                Malo por reparar
                <span class="caja">${estado === 'reparar' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                Malo para baja
                <span class="caja">${estado === 'baja' ? '✔' : ''}</span>
            </td>

        </tr>

    </table>

    <!-- TRABAJOS -->

    <div class="seccion">
        V. TRABAJOS REALIZADOS
    </div>

    <div class="recuadro">

        ${ficha.TrabajosRealizados || ''}

    </div>

    <!-- DIAGNOSTICO -->

    <div class="seccion">
        VI. DIAGNOSTICO
    </div>

    <div class="recuadro">

        ${ficha.Diagnostico || ''}

    </div>

    <!-- RECOMENDACION -->

    <div class="seccion">
        VII. RECOMENDACIÓN
    </div>

    <div class="recuadro">

        ${ficha.Recomendacion || ''}

    </div>

    <!-- FIRMAS -->

    <div class="firmas">

        <div class="firma">
            <div class="firma-line">
                <span class="firma-text">RESPONSABLE DE SOPORTE TECNICO</span>
            </div>
        </div>

        <div class="firma">
            <div class="firma-line">
                <span class="firma-text">JEFE UNIDAD DE ESTADISTICA E INFORMATICA</span>
            </div>
        </div>

        <div class="firma">
            <div class="firma-line">
                <span class="firma-text">AREA USUARIA</span>
            </div>
        </div>

    </div>

    <div class="footer">
        &nbsp;
    </div>

</div>

</body>
</html>`;

    const printWindow = window.open("", "FichaDeSoporte", "width=900,height=1200");
    if (!printWindow) {
      alert("No se pudo abrir la ventana de impresión. Verifique el bloqueador de ventanas emergentes.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 500);
    };
  };

  // =========================
  // SUBMIT
  // =========================

  const onSubmit = async (data: any) => {
    if (!data.UnidadOrganica) {
      data.UnidadOrganica = "UNIDAD DE ESTADISTICA E INFORMATICA";
    }
    if (!editingFicha && sessionData?.user?.id) {
      data.IdUsuarioSoporte = String(sessionData.user.id);
    }
    if (!editingFicha && sessionData?.user?.name) {
      const parts = sessionData.user.name.split(" ");
      const initials = parts.map((p: string) => p[0]).join("").toUpperCase().slice(0, 10);
      data.Siglas = initials;
    } else if (!editingFicha && sessionData?.user?.username) {
      data.Siglas = sessionData.user.username.toUpperCase().slice(0, 10);
    }
    
    // Limpiar firmas para que no guarden basura
    data.FirmaSoporte = "";
    data.FirmaJefeUnidad = "";
    data.FirmaAreaUsuario = "";

    try {
      await saveFichaMutation.mutateAsync(data);
    } catch (e: any) {
      alert(e.message || "Error al guardar la ficha");
    }
  };

  // =========================
  // EDITAR
  // =========================

  const handleEdit = (ficha: any) => {
    setEditingFicha(ficha);

    // Set form values
    Object.keys(ficha).forEach((key) => {
      setValue(key, String(ficha[key] ?? ""));
    });

    if (ficha.IdBien) {
      setValue("IdBien", String(ficha.IdBien));
    }
    if (ficha.IdPrioridad) {
      setValue("IdPrioridad", String(ficha.IdPrioridad));
    }
    if (ficha.IdCondicion) {
      setValue("IdCondicion", String(ficha.IdCondicion));
    }
    if (ficha.IdEstadoBien) {
      setValue("IdEstadoBien", String(ficha.IdEstadoBien));
    }

    if (ficha.TipoBien) {
      setTipoBien(ficha.TipoBien);
    }

    if (ficha.Condicion?.Condicion) {
      setCondicionBien(ficha.Condicion.Condicion);
    } else if (ficha.Bien?.Condicion?.Condicion) {
      setCondicionBien(ficha.Bien.Condicion.Condicion);
    }

    setOpen(true);
  };

  // =========================
  // NUEVO
  // =========================

  const handleNuevo = () => {
    reset();
    setEditingFicha(null);
    setTipoBien("");
    setCondicionBien("");

    // Autogenerate NumeroFicha: ST-YYYYMMDD-XXXX
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    const generatedNumero = `ST-${yyyymmdd}-${random}`;

    setValue("NumeroFicha", generatedNumero);
    setValue("UnidadOrganica", "UNIDAD DE ESTADISTICA E INFORMATICA");
    if (sessionData?.user?.id) {
      setValue("IdUsuarioSoporte", String(sessionData.user.id));
    }

    setOpen(true);
  };


  // =========================
  // RENDER
  // =========================

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Fichas de Soporte
          </h1>

          <p className="text-sm text-muted-foreground">
            Gestión de incidencias y soporte técnico
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar
          </Button>

          <Button onClick={handleNuevo}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Ficha
          </Button>
        </div>
      </div>

      {/* BUSQUEDA */}

      <div className="flex gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

          <Input
            placeholder="Buscar ficha..."
            value={buscarText}
            onChange={(e) => setBuscarText(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* TABLA */}

      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Bien</th>
              <th className="p-3 text-left">Cód. Patrimonial</th>
              <th className="p-3 text-left">Responsable</th>
              <th className="p-3 text-left">Área</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Prioridad</th>
              <th className="p-3 text-left">Usuario Reg.</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  Cargando...
                </td>
              </tr>
            ) : fichas?.length > 0 ? (
              fichas.map((ficha: any) => (
                <tr key={ficha.IdSoporte} className="border-t hover:bg-slate-50 transition-colors text-xs">
                  <td className="p-3 font-medium text-slate-700">{ficha.NumeroFicha || "-"}</td>
                  <td className="p-3">{ficha?.Bien?.Descripcion || "-"}</td>
                  <td className="p-3">{ficha?.Bien?.CodigoPatrimonial || "-"}</td>
                  <td className="p-3">{ficha?.Responsable || "-"}</td>
                  <td className="p-3">{ficha?.Dependencia || "-"}</td>
                  <td className="p-3">{ficha?.Estado?.EstadoBien || "-"}</td>
                  <td className="p-3">{ficha?.Prioridad?.NombrePrioridad || "-"}</td>
                  <td className="p-3 text-slate-500">{ficha?.Usuario_Nombres || ficha?.UsuarioSoporte?.Nombres || ficha?.UsuarioSoporte?.Usuario || "-"}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        onClick={() => {
                          setViewingFicha(ficha);
                          setVerOpen(true);
                        }}
                        title="Ver Ficha"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleEdit(ficha)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Desactivar"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(ficha.IdSoporte)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                        onClick={() => {
                          setSelectedFichaForPrint(ficha);
                          setPrintActionOpen(true);
                        }}
                        title="Opciones de Impresión"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  No hay registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFicha ? "Editar Ficha de Soporte" : "Nueva Ficha de Soporte"}
            </DialogTitle>
            <DialogDescription>
              Complete todos los campos para registrar la ficha de soporte técnico.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* SECCION 1: DATOS DE CONTROL Y RESPONSABLE */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                1. Datos de la Ficha y Responsable
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Nº de Ficha</Label>
                  <Input {...register("NumeroFicha", { required: true })} placeholder="Ej: ST-20260519-1234" />
                  {errors.NumeroFicha && <span className="text-xs text-red-500">Este campo es requerido</span>}
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Unidad Orgánica</Label>
                  <Input {...register("UnidadOrganica")} readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Usuario Responsable</Label>
                  <Input {...register("Responsable", { required: true })} placeholder="Nombre del responsable del bien" />
                  {errors.Responsable && <span className="text-xs text-red-500">Este campo es requerido</span>}
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Dependencia (Área)</Label>
                  <Select
                    value={watch("Dependencia") || undefined}
                    onValueChange={(value) => setValue("Dependencia", value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccione dependencia / área">
                        {watch("Dependencia")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {areas?.map((area) => (
                        <SelectItem key={area.IdArea} value={area.NombreArea}>
                          {area.NombreArea}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Ambiente</Label>
                  <Input {...register("Ambiente")} placeholder="Ambiente / Ubicación física" />
                </div>
              </div>
            </div>

            {/* SECCION 2: ACTIVO Y DETALLE TÉCNICO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                2. Selección del Activo / Bien
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Bien / Activo</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      placeholder="Haga clic en el botón (...) para buscar"
                      value={(() => {
                        const selected = bienes?.find((b: Bien) => String(b.IdBien) === String(watch("IdBien")));
                        if (!selected) return "";
                        return `${selected.Descripcion} ${selected.NumeroSerie ? `(S/N: ${selected.NumeroSerie})` : ""} ${selected.CodigoPatrimonial ? `(Pat: ${selected.CodigoPatrimonial})` : ""}`;
                      })()}
                      className="bg-slate-100 border-slate-200 cursor-not-allowed text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLookupOpen(true)}
                      className="border-slate-300 hover:bg-slate-100 px-3 font-semibold text-slate-700"
                      title="Buscar bien"
                    >
                      ...
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Prioridad</Label>
                  <Select
                    value={watch("IdPrioridad") ? String(watch("IdPrioridad")) : undefined}
                    onValueChange={(value) => setValue("IdPrioridad", value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccione prioridad">
                        {prioridades?.find((p) => String(p.IdPrioridad) === String(watch("IdPrioridad")))?.NombrePrioridad}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades?.map((p) => (
                        <SelectItem key={p.IdPrioridad} value={String(p.IdPrioridad)}>
                          {p.NombrePrioridad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DETALLE TÉCNICO CARD */}
              <div className="bg-white border rounded-lg p-4 text-xs space-y-2">
                <span className="font-bold block text-slate-500 mb-1">Detalle Técnico del Activo Seleccionado:</span>
                {watch("IdBien") ? (
                  (() => {
                    const selected = bienes?.find((b: Bien) => String(b.IdBien) === String(watch("IdBien")));
                    return selected ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                        <div><span className="font-semibold text-slate-500">Bien:</span> {selected.Descripcion || "-"}</div>
                        <div><span className="font-semibold text-slate-500">Código Inventario:</span> {selected.CodigoInventario || "-"}</div>
                        <div><span className="font-semibold text-slate-500">Código Patrimonial:</span> {selected.CodigoPatrimonial || "-"}</div>
                        <div><span className="font-semibold text-slate-500">Marca:</span> {selected.Marca?.Marca || "-"}</div>
                        <div><span className="font-semibold text-slate-500">Modelo:</span> {selected.Modelo?.Modelo || "-"}</div>
                        <div><span className="font-semibold text-slate-500">Nº Serie:</span> {selected.NumeroSerie || "-"}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Activo no encontrado</span>
                    );
                  })()
                ) : (
                  <span className="text-slate-400">Seleccione un bien de la lista para ver sus especificaciones técnicas.</span>
                )}
              </div>
            </div>

            {/* SECCION 3: CLASIFICACIÓN Y CONDICIÓN */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                3. Tipo, Condición y Estado del Bien
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TIPO BIEN */}
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Tipo de Bien (Elegir uno)</Label>
                  <div className="space-y-2 bg-white p-3 rounded-lg border">
                    {tiposBien?.map((tipo) => (
                      <div key={tipo.IdTipoBien} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`tipoBien-${tipo.IdTipoBien}`}
                          name="tipoBien"
                          value={tipo.TipoBien}
                          checked={tipoBien === tipo.TipoBien}
                          onChange={(e) => {
                            setTipoBien(e.target.value);
                            setValue("TipoBien", e.target.value);
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`tipoBien-${tipo.IdTipoBien}`} className="text-xs cursor-pointer text-slate-700">
                          {tipo.TipoBien}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CONDICION */}
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Condición (Elegir uno)</Label>
                  <div className="space-y-2 bg-white p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="condicion-operativo"
                        name="condicionBien"
                        value="Operativo"
                        checked={condicionBien === "Operativo" || watch("IdCondicion") === "1"}
                        onChange={() => {
                          setCondicionBien("Operativo");
                          setValue("IdCondicion", "1");
                          setValue("IdEstadoBien", "");
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="condicion-operativo" className="text-xs cursor-pointer text-slate-700">Operativo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="condicion-inoperativo"
                        name="condicionBien"
                        value="Inoperativo"
                        checked={condicionBien === "Inoperativo" || watch("IdCondicion") === "2"}
                        onChange={() => {
                          setCondicionBien("Inoperativo");
                          setValue("IdCondicion", "2");
                          setValue("IdEstadoBien", "");
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="condicion-inoperativo" className="text-xs cursor-pointer text-slate-700">Inoperativo</Label>
                    </div>
                  </div>
                </div>

                {/* ESTADO BIEN */}
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Estado del Bien (Elegir uno)</Label>
                  <div className="space-y-2 bg-white p-3 rounded-lg border min-h-[82px] flex flex-col justify-center">
                    {estadoBienOptions.length > 0 ? (
                      estadoBienOptions.map((estado) => (
                        <div key={estado.IdEstadoBien} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`estado-${estado.IdEstadoBien}`}
                            name="estadoBien"
                            value={String(estado.IdEstadoBien)}
                            checked={String(watch("IdEstadoBien")) === String(estado.IdEstadoBien)}
                            onChange={(e) => {
                              setValue("IdEstadoBien", e.target.value);
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={`estado-${estado.IdEstadoBien}`} className="text-xs cursor-pointer text-slate-700">
                            {estado.EstadoBien}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 text-center block">Seleccione primero la condición.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCION 4: TRABAJOS Y DIAGNÓSTICO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                4. Trabajos Realizados y Diagnóstico
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Problema Solicitado / Reportado</Label>
                  <Textarea
                    {...register("DescripcionProblema")}
                    placeholder="Escriba la descripción del problema original reportado por el usuario..."
                    className="h-20 bg-white"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-bold text-slate-600">Trabajos Realizados (Texto libre)</Label>
                  <Textarea
                    {...register("TrabajosRealizados")}
                    placeholder="Detalle todas las actividades y correcciones técnicas realizadas..."
                    className="h-24 bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-600">Diagnóstico (Texto libre)</Label>
                    <Textarea
                      {...register("Diagnostico")}
                      placeholder="Conclusión del diagnóstico sobre el estado real del bien..."
                      className="h-24 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-bold text-slate-600">Recomendación (Texto libre)</Label>
                    <Textarea
                      {...register("Recomendacion")}
                      placeholder="Recomendaciones técnicas de uso o derivaciones..."
                      className="h-24 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>



            {/* FOOTER ACCIONES */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveFichaMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saveFichaMutation.isPending ? "Guardando..." : "Guardar Ficha"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETALLE Y VISTA IMPRIMIBLE MODAL */}
      <Dialog open={verOpen} onOpenChange={setVerOpen}>
        <DialogContent className="bg-white sm:max-w-4xl max-h-[90vh] overflow-y-auto print:max-h-none print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Detalle de Ficha de Soporte</DialogTitle>
            <DialogDescription>
              Vista de impresión y detalles técnicos de la ficha registrada.
            </DialogDescription>
          </DialogHeader>

          {viewingFicha && (
            <div className="space-y-6 p-4 border rounded-lg bg-white print:border-none print:p-0 text-slate-800">
              {/* PRINTABLE CONTAINER */}
              <div id="printable-ficha" className="space-y-6">
                {/* HEADER */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">UNIDAD DE ESTADISTICA E INFORMATICA</p>
                    <h2 className="text-base font-extrabold text-slate-800 mt-1">FICHA DE SOPORTE TÉCNICO</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold bg-slate-100 px-3 py-1 rounded border text-slate-800 inline-block">
                      Nº {viewingFicha.NumeroFicha || "-"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Fecha: {viewingFicha.FechaRegistro ? new Date(viewingFicha.FechaRegistro).toLocaleString() : "-"}
                    </p>
                  </div>
                </div>

                {/* RESPONSABLE INFO */}
                <div className="grid grid-cols-3 gap-4 text-[11px] bg-slate-50 p-3 rounded border">
                  <div>
                    <span className="font-bold block text-slate-500">RESPONSABLE DEL BIEN</span>
                    <span className="font-medium text-xs text-slate-800">{viewingFicha.Responsable || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-500">DEPENDENCIA (ÁREA)</span>
                    <span className="font-medium text-xs text-slate-800">{viewingFicha.Dependencia || "-"}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-500">AMBIENTE</span>
                    <span className="font-medium text-xs text-slate-800">{viewingFicha.Ambiente || "-"}</span>
                  </div>
                </div>

                {/* SECTION I: TIPO DEL BIEN */}
                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                    I. Tipo del Bien
                  </h3>
                  <div className="border border-t-0 p-3 rounded-b flex gap-6 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={viewingFicha.TipoBien?.toLowerCase() === "informático" || viewingFicha.TipoBien?.toLowerCase() === "informatico"}
                        readOnly
                        className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>Informático</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={viewingFicha.TipoBien?.toLowerCase() === "comunicación" || viewingFicha.TipoBien?.toLowerCase() === "comunicacion"}
                        readOnly
                        className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>Comunicación</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={viewingFicha.TipoBien?.toLowerCase() === "eléctrico" || viewingFicha.TipoBien?.toLowerCase() === "electrico"}
                        readOnly
                        className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                      />
                      <span>Eléctrico</span>
                    </label>
                  </div>
                </div>

                {/* SECTION II: DETALLE TÉCNICO */}
                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                    II. Detalle Técnico del Bien
                  </h3>
                  <div className="border border-t-0 rounded-b overflow-hidden">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b">
                          <th className="p-2 border-r font-bold">Código Inventario</th>
                          <th className="p-2 border-r font-bold">Código Patrimonial</th>
                          <th className="p-2 border-r font-bold">Bien / Descripción</th>
                          <th className="p-2 border-r font-bold">Marca</th>
                          <th className="p-2 border-r font-bold">Modelo</th>
                          <th className="p-2 font-bold">Nº Serie</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border-r border-b">{viewingFicha.Bien?.CodigoInventario || "-"}</td>
                          <td className="p-2 border-r border-b">{viewingFicha.Bien?.CodigoPatrimonial || "-"}</td>
                          <td className="p-2 border-r border-b">{viewingFicha.Bien?.Descripcion || "-"}</td>
                          <td className="p-2 border-r border-b">{viewingFicha.Bien?.Marca?.Marca || "-"}</td>
                          <td className="p-2 border-r border-b">{viewingFicha.Bien?.Modelo?.Modelo || "-"}</td>
                          <td className="p-2 border-b">{viewingFicha.Bien?.NumeroSerie || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION III & IV: CONDICIÓN Y ESTADO */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      III. Condición del Bien
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b flex gap-6 text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={String(viewingFicha.IdCondicion) === "1" || viewingFicha.Condicion?.Condicion?.toUpperCase() === "OPERATIVO"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Operativo</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={String(viewingFicha.IdCondicion) === "2" || viewingFicha.Condicion?.Condicion?.toUpperCase() === "INOPERATIVO"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Inoperativo</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      IV. Estado del Bien
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b flex gap-4 text-[11px] flex-wrap">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={viewingFicha.Estado?.EstadoBien?.toUpperCase() === "BUENO" || String(viewingFicha.IdEstadoBien) === "1"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Bueno</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={viewingFicha.Estado?.EstadoBien?.toUpperCase() === "REGULAR" || String(viewingFicha.IdEstadoBien) === "2"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Regular</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={viewingFicha.Estado?.EstadoBien?.toUpperCase() === "REPARAR" || String(viewingFicha.IdEstadoBien) === "3"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Reparar</span>
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={viewingFicha.Estado?.EstadoBien?.toUpperCase() === "BAJA" || String(viewingFicha.IdEstadoBien) === "4"}
                          readOnly
                          className="rounded text-blue-600 pointer-events-none"
                        />
                        <span>Baja</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* TEXT SECTIONS V, VI, VII */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      V. Trabajos Realizados
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">
                      {viewingFicha.TrabajosRealizados || "Ninguno"}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      VI. Diagnóstico
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">
                      {viewingFicha.Diagnostico || "Ninguno"}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">
                      VII. Recomendaciones
                    </h3>
                    <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">
                      {viewingFicha.Recomendacion || "Ninguna"}
                    </div>
                  </div>
                </div>

                {/* FIRMAS SECTION */}
                <div className="pt-20 grid grid-cols-3 gap-6 text-center text-[10px] uppercase font-bold text-slate-700">
                  <div className="flex flex-col items-center justify-end h-24">
                    <div className="w-4/5 border-t border-slate-900 mb-2"></div>
                    <span>RESP. DE SOPORTE TÉCNICO</span>
                  </div>
                  <div className="flex flex-col items-center justify-end h-24">
                    <div className="w-4/5 border-t border-slate-900 mb-2"></div>
                    <span>JEFE DE LA UNIDAD DE ESTADISTICA E INFORMATICA</span>
                  </div>
                  <div className="flex flex-col items-center justify-end h-24">
                    <div className="w-4/5 border-t border-slate-900 mb-2"></div>
                    <span>ÁREA USUARIA</span>
                  </div>
                </div>

                {/* CREATOR USER DETAIL */}
                <div className="text-[10px] text-slate-400 flex justify-between border-t pt-3 mt-4 print:mt-12">
                  <span>SISTEMA DE SOPORTE TI</span>
                  <span>REGISTRADO POR: {viewingFicha.Usuario_Nombres || viewingFicha.UsuarioSoporte?.Nombres || viewingFicha.UsuarioSoporte?.Usuario || "ADMIN"}</span>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
                <Button variant="outline" onClick={() => setVerOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG OPCIONES DE IMPRESIÓN */}
      <Dialog open={printActionOpen} onOpenChange={setPrintActionOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Exportar / Imprimir Ficha</DialogTitle>
            <DialogDescription>
              ¿Qué desea hacer con la ficha <span className="font-bold text-slate-800">{selectedFichaForPrint?.NumeroFicha}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-6 justify-center">
            <Button
              className="flex-1 h-32 flex flex-col gap-3 bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-transform hover:scale-105"
              onClick={() => handlePrintTicket(selectedFichaForPrint)}
            >
              <Printer className="h-10 w-10" />
              <span className="font-semibold text-base">Imprimir PDF</span>
            </Button>
            <Button
              className="flex-1 h-32 flex flex-col gap-3 bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform hover:scale-105"
              onClick={() => handleExportSingleExcel(selectedFichaForPrint)}
            >
              <FileSpreadsheet className="h-10 w-10" />
              <span className="font-semibold text-base">Descargar Excel</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG BUSCADOR DE BIENES (LOOKUP) */}
      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="sm:max-w-4xl bg-white max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Buscar Activo / Bien
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {selectedAreaName 
                ? `Mostrando equipos asignados a la dependencia: ${selectedAreaName}` 
                : "Mostrando todos los equipos disponibles (seleccione un área en el formulario para filtrar)"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Descripción, N° Serie, Cód. Patrimonial o Cód. Inventario..."
                value={lookupSearch}
                onChange={(e) => setLookupSearch(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Tabla de Equipos */}
            <div className="border rounded-lg overflow-y-auto flex-1 max-h-[450px]">
              <table className="w-full text-xs text-left text-slate-600 border-collapse">
                <thead className="text-[10px] text-slate-700 uppercase bg-slate-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cód. Inventario</th>
                    <th className="px-4 py-3 font-semibold">Cód. Patrimonial</th>
                    <th className="px-4 py-3 font-semibold">Descripción</th>
                    <th className="px-4 py-3 font-semibold">Marca / Modelo</th>
                    <th className="px-4 py-3 font-semibold">N° Serie</th>
                    <th className="px-4 py-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lookupFilteredBienes.length > 0 ? (
                    lookupFilteredBienes.map((bien: Bien) => (
                      <tr 
                        key={bien.IdBien} 
                        className="bg-white border-b hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-700">{bien.CodigoInventario || "-"}</td>
                        <td className="px-4 py-3">{bien.CodigoPatrimonial || "-"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{bien.Descripcion}</td>
                        <td className="px-4 py-3">{bien.Marca?.Marca || "-"} / {bien.Modelo?.Modelo || "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{bien.NumeroSerie || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-3"
                            onClick={() => {
                              setValue("IdBien", String(bien.IdBien));
                              setLookupOpen(false);
                              setLookupSearch("");
                            }}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        No se encontraron equipos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setLookupOpen(false);
                setLookupSearch("");
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }

          /* 1. Ocultar TODOS los hijos directos del body por defecto (esto oculta Sidebar, Header, Tablas, etc) */
          body > * {
            display: none !important;
          }

          /* 2. Mostrar explícitamente el portal que contiene nuestro Dialog */
          body > [data-radix-portal],
          body > div:has([role="dialog"]) {
            display: block !important;
          }

          /* 3. Preparar la página para la impresión del modal */
          html, body {
            background: white !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* 4. Ocultar fondos oscuros de los modales (overlay) */
          .bg-black\\/80, 
          .bg-background\\/80, 
          [data-state="open"] > .fixed.inset-0,
          div[class*="fixed inset-0 z-50"] {
            display: none !important;
          }

          /* 5. Configurar el modal para impresión a pantalla completa */
          [role="dialog"] {
            display: block !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          /* 6. Forzar la impresión de colores de fondo, muy importante para las cabeceras */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* 7. Ocultar elementos no deseados dentro de la ficha (como los botones) */
          .print\\:hidden, button {
            display: none !important;
          }
          
          /* Estilos para los checkboxes */
          input[type="checkbox"] {
            -webkit-appearance: none;
            appearance: none;
            background-color: white;
            border: 1px solid #94a3b8;
            border-radius: 3px;
            width: 12px;
            height: 12px;
            display: inline-block;
            position: relative;
          }
          input[type="checkbox"]:checked {
            background-color: #2563eb;
            border-color: #2563eb;
          }
          input[type="checkbox"]:checked::after {
            content: '✔';
            color: white;
            font-size: 10px;
            position: absolute;
            top: -2px;
            left: 1px;
          }
        }
      `}} />

      {/* CONTENEDOR OCULTO PARA IMPRESIÓN DIRECTA SIN ESPERAR ANIMACIONES */}
      <div style={{ display: 'none' }}>
        <div id="hidden-printable-ficha">
          {selectedFichaForPrint ? (
            <div>
              <style>{`@page{size:A4;margin:20mm;} *{box-sizing:border-box;} body{font-family:Arial, Helvetica, sans-serif;font-size:11px;color:#000;margin:0;padding:0;} .container{width:88%;margin:0 auto;} .titulo{text-align:center;font-weight:bold;font-size:18px;margin-bottom:25px;} table{width:100%;border-collapse:collapse;} td, th{border:1px solid #000;padding:6px;vertical-align:middle;} .sin-borde{border:none !important;} .seccion{margin-top:18px;margin-bottom:8px;font-weight:bold;} .caja{width:18px;height:18px;border:2px solid #000;display:inline-block;vertical-align:middle;margin-left:6px;} .texto-centro{text-align:center;} .recuadro{border:2px solid #000;min-height:80px;padding:15px;} .firmas{margin-top:90px;display:flex;justify-content:space-between;gap:20px;} .firma{width:30%;text-align:center;} .linea{border-top:1px solid #000;padding-top:5px;} .fecha{width:120px;text-align:center;font-weight:bold;} .footer{margin-top:40px;} @media print{ .no-print{display:none !important;} body{margin:0;} .container{width:100%;} }`}</style>

              <div className="container">

                <div className="titulo">FICHA DE SOPORTE TECNICO</div>

                <table>
                  <tbody>
                    <tr>
                      <td style={{ width: '20%' }}><b>Unidad Organica :</b></td>
                      <td>{selectedFichaForPrint.UnidadOrganica || ''}</td>
                      <td className="fecha">FECHA<br /><br />{selectedFichaForPrint.FechaRegistro ? new Date(selectedFichaForPrint.FechaRegistro).toLocaleDateString() : ''}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="seccion">USUARIO RESPONSABLE DEL BIEN:</div>

                <table>
                  <tbody>
                    <tr>
                      <td style={{ width: '15%' }}><b>Responsable:</b></td>
                      <td>{selectedFichaForPrint.Responsable || ''}</td>
                    </tr>
                    <tr>
                      <td><b>Dependencia:</b></td>
                      <td>{selectedFichaForPrint.Dependencia || ''}</td>
                    </tr>
                    <tr>
                      <td><b>Ambiente:</b></td>
                      <td>{selectedFichaForPrint.Ambiente || ''}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="seccion">I. TIPO DEL BIEN</div>

                <table>
                  <tbody>
                    <tr>
                      <td className="sin-borde">a) Informático <span className="caja">{(selectedFichaForPrint.TipoBien || '').toLowerCase().includes('inform') ? '✔' : ''}</span></td>
                      <td className="sin-borde">b) Comunicación <span className="caja">{(selectedFichaForPrint.TipoBien || '').toLowerCase().includes('comunic') ? '✔' : ''}</span></td>
                      <td className="sin-borde">c) Eléctrico <span className="caja">{(selectedFichaForPrint.TipoBien || '').toLowerCase().includes('electr') ? '✔' : ''}</span></td>
                    </tr>
                  </tbody>
                </table>

                <div className="seccion">II. DETALLE TECNICO</div>
                <table>
                  <tr>
                    <th rowSpan={2} style={{ width: '16%' }}>CODIGO DE INVENTARIO</th>
                    <th rowSpan={2} style={{ width: '16%' }}>CODIGO PATRIMONIAL</th>
                    <th rowSpan={2} style={{ width: '22%' }}>DESCRIPCION</th>
                    <th colSpan={3}>DETALLE TECNICO</th>
                  </tr>
                  <tr>
                    <th>MARCA</th>
                    <th>MODELO</th>
                    <th>SERIE</th>
                  </tr>
                  <tr>
                    <td style={{ height: '50px' }}>{selectedFichaForPrint.Bien?.CodigoInventario || ''}</td>
                    <td>{selectedFichaForPrint.Bien?.CodigoPatrimonial || ''}</td>
                    <td>{selectedFichaForPrint.Bien?.Descripcion || ''}</td>
                    <td>{selectedFichaForPrint.Bien?.Marca?.Marca || ''}</td>
                    <td>{selectedFichaForPrint.Bien?.Modelo?.Modelo || ''}</td>
                    <td>{selectedFichaForPrint.Bien?.NumeroSerie || ''}</td>
                  </tr>
                </table>

                <div className="seccion">III. CONDICION DEL BIEN</div>
                <table>
                  <tr>
                    <td className="sin-borde">Operativo <span className="caja">{selectedFichaForPrint.Condicion?.Condicion?.toLowerCase() === 'operativo' ? '✔' : ''}</span></td>
                  </tr>
                  <tr>
                    <td className="sin-borde">Inoperativo <span className="caja">{selectedFichaForPrint.Condicion?.Condicion?.toLowerCase() === 'inoperativo' ? '✔' : ''}</span></td>
                  </tr>
                </table>

                <div className="seccion">IV. ESTADO DEL BIEN</div>
                <table>
                  <tr>
                    <td className="sin-borde">Bueno <span className="caja">{selectedFichaForPrint.Estado?.EstadoBien?.toLowerCase() === 'bueno' ? '✔' : ''}</span></td>
                    <td className="sin-borde">Regular <span className="caja">{selectedFichaForPrint.Estado?.EstadoBien?.toLowerCase() === 'regular' ? '✔' : ''}</span></td>
                    <td className="sin-borde">Malo por reparar <span className="caja">{['reparar', 'malo por reparar'].includes((selectedFichaForPrint.Estado?.EstadoBien || '').toLowerCase()) ? '✔' : ''}</span></td>
                    <td className="sin-borde">Malo para baja <span className="caja">{['baja', 'malo para baja'].includes((selectedFichaForPrint.Estado?.EstadoBien || '').toLowerCase()) ? '✔' : ''}</span></td>
                  </tr>
                </table>

                <div className="seccion">V. TRABAJOS REALIZADOS</div>
                <div className="recuadro">{selectedFichaForPrint.TrabajosRealizados || ''}</div>

                <div className="seccion">VI. DIAGNOSTICO</div>
                <div className="recuadro">{selectedFichaForPrint.Diagnostico || ''}</div>

                <div className="seccion">VII. RECOMENDACIÓN</div>
                <div className="recuadro">{selectedFichaForPrint.Recomendacion || ''}</div>

                <div className="firmas">
                  <div className="firma"><div className="linea">RESPONSABLE DE SOPORTE TECNICO</div></div>
                  <div className="firma"><div className="linea">JEFE UNIDAD DE ESTADISTICA E INFORMATICA</div></div>
                  <div className="firma"><div className="linea">AREA USUARIA</div></div>
                </div>

                <div className="footer">&nbsp;</div>

              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}