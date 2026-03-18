export type SatProductCategory = {
  key: string;
  label: string;
};

// Claves de referencia del catalogo SAT (ClaveProdServ) para uso general en inventario.
export const SAT_PRODUCT_CATEGORIES: SatProductCategory[] = [
  { key: "10101500", label: "Animales vivos" },
  { key: "11101500", label: "Minerales" },
  { key: "12141700", label: "Materiales para limpieza" },
  { key: "14111500", label: "Papeleria" },
  { key: "20102300", label: "Maquinaria de procesamiento" },
  { key: "23153100", label: "Equipo de manufactura" },
  { key: "24111500", label: "Empaques y envases" },
  { key: "30101500", label: "Materiales de construccion" },
  { key: "39121000", label: "Suministros electricos" },
  { key: "41111600", label: "Instrumentos de medicion" },
  { key: "42140000", label: "Suministros medicos" },
  { key: "43191500", label: "Telefonia y comunicaciones" },
  { key: "43211500", label: "Computadoras" },
  { key: "44120000", label: "Suministros de oficina" },
  { key: "45121500", label: "Camaras y fotografia" },
  { key: "47131600", label: "Productos de limpieza" },
  { key: "50190000", label: "Alimentos preparados y conservados" },
  { key: "52150000", label: "Electrodomesticos" },
  { key: "53100000", label: "Ropa" },
  { key: "56101500", label: "Mobiliario" },
];
