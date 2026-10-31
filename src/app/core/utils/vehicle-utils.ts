/**
 * Utilidades para manejo de vehículos y placas automotrices en Luxury Services.
 * Elimina redundancias visuales entre el título del vehículo y su placa.
 */

/**
 * Limpia el nombre o título del vehículo removiendo repeticiones redundantes de la placa
 * que puedan venir entre paréntesis, guiones o al final del texto.
 * 
 * Ejemplos:
 * - cleanVehicleTitle("Land Rover Range Rover SV Autobiography (RNG-404)", "RNG-404")
 *   -> "Land Rover Range Rover SV Autobiography"
 * - cleanVehicleTitle("dsvv xzbbxb (ABC234)", "ABC234")
 *   -> "dsvv xzbbxb"
 * - cleanVehicleTitle("Mercedes-Benz AMG G 63 (VIP-777)", "VIP-777")
 *   -> "Mercedes-Benz AMG G 63"
 */
export function cleanVehicleTitle(vehiculo: string | null | undefined, placa?: string | null): string {
  if (!vehiculo) return '';
  let cleaned = vehiculo.trim();

  // Si tenemos la placa conocida, removerla directamente con cualquier envoltura
  if (placa && placa.trim()) {
    const rawPlaca = placa.trim();
    // Escapar caracteres especiales para regex
    const escaped = rawPlaca.replace(/[-\s]/g, '[- ]?');
    // Patrones: (PLACA), [PLACA], - PLACA, / PLACA, o PLACA al final
    const patterns = [
      new RegExp(`\\s*\\([\\s-]*${escaped}[\\s-]*\\)`, 'gi'),
      new RegExp(`\\s*\\[[\\s-]*${escaped}[\\s-]*\\]`, 'gi'),
      new RegExp(`\\s*-\\s*${escaped}\\b`, 'gi'),
      new RegExp(`\\s*\\/\\s*${escaped}\\b`, 'gi'),
      new RegExp(`\\s+${escaped}$`, 'gi'),
    ];

    for (const pat of patterns) {
      cleaned = cleaned.replace(pat, '');
    }
  }

  // Remover cualquier patrón redundante residual tipo (ABC123), (ABC-123), (VIP-777) al final
  cleaned = cleaned.replace(/\s*\([A-Z0-9\-\s]{5,10}\)\s*$/i, '');
  cleaned = cleaned.replace(/\s*-\s*[A-Z0-9]{3,4}[- ]?[A-Z0-9]{2,3}\s*$/i, '');

  return cleaned.trim() || vehiculo.trim();
}

/**
 * Formatea una placa para visualización administrativa de alta gama.
 * Si es de 6 caracteres alfanuméricos (3 letras + 3 números ej. ABC123),
 * puede presentarse con separación elegante tipo ABC-123 o ABC · 123 según el contexto.
 */
export function formatPlateDisplay(placa?: string | null): string {
  if (!placa) return '';
  const clean = placa.toUpperCase().trim();
  if (/^[A-Z]{3}[0-9]{3}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}
