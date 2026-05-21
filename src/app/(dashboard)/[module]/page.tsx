interface PageProps {
  params: Promise<{ module: string }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { module } = await params;
  
  // Capitalizar la primera letra
  const title = module.charAt(0).toUpperCase() + module.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Módulo de {title}</h1>
        <p className="text-slate-500 text-sm">Esta sección está actualmente en construcción.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <p className="text-slate-600">Aquí se implementará el CRUD y las funcionalidades para el módulo de **{module}**.</p>
      </div>
    </div>
  );
}
