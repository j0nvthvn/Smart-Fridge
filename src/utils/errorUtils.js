/**
 * Convierte un error de Supabase o de red en un mensaje legible en español.
 * @param {Error|object} error
 * @returns {string}
 */
export function parseSupabaseError(error) {
  if (!error) return 'Ocurrió un error inesperado.';

  const msg = (error.message || '').toLowerCase();
  const code = error.code || error.status || '';

  // Sin conexión / red
  if (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('abort') ||
    code === 'NETWORK_ERROR'
  ) {
    return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  }

  // Sesión expirada / JWT
  if (
    msg.includes('jwt') ||
    msg.includes('session') ||
    msg.includes('not authenticated') ||
    code === 'PGRST301'
  ) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  // Permisos RLS
  if (
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('rls')
  ) {
    return 'No tienes permiso para realizar esta acción.';
  }

  // Duplicado
  if (msg.includes('duplicate') || code === '23505') {
    return 'Ya existe un registro con esos datos.';
  }

  // Registro no encontrado
  if (msg.includes('no rows') || code === 'PGRST116') {
    return 'No se encontró el registro solicitado.';
  }

  // Error genérico de Supabase con mensaje
  if (error.message) return error.message;

  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
