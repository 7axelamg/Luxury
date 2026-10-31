/**
 * Feature Flags Configuration
 * Control de activación/desactivación de módulos del sistema.
 */
export const FEATURE_FLAGS = {
  /**
   * Módulo 'Trabajos Mecánicos' (Paso intermedio técnico/lubricación)
   * Desactivado temporalmente a solicitud del negocio.
   * Cambiar a `true` para reactivar en cualquier momento.
   */
  ENABLE_TRABAJOS_MECANICOS: false,

  /**
   * Generación y liquidación automática de factura interactiva en cotización
   */
  ENABLE_FACTURA_EN_COTIZACION: true,

  /**
   * Flujo simplificado de 2 pasos operativos
   */
  WORKFLOW_2_STEPS: true,
};
