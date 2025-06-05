/**
 * Función para manejar el desplazamiento suave a las secciones al hacer clic en enlaces de navegación
 * @param e - Evento del clic
 * @param id - ID del elemento al que desplazarse
 */
export const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string): void => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    window.scrollTo({
      top: element.offsetTop - 80, // Considerando el tamaño de la navbar
      behavior: 'smooth'
    });
  }
};

/**
 * Función para formatear fechas en formato español
 * @param date - Fecha a formatear
 * @returns Fecha formateada en español
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Valida si un email tiene formato correcto
 * @param email - Email a validar
 * @returns Booleano indicando si el email es válido
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Genera metadata para SEO de la página
 * @param title - Título de la página
 * @param description - Descripción de la página
 * @returns Objeto con la metadata SEO
 */
export const generateSEOMetadata = (title: string, description: string) => {
  const baseTitle = 'Daniel Iturra | Desarrollador Fullstack';
  
  return {
    title: title ? `${title} | ${baseTitle}` : baseTitle,
    description: description || 'Analista Programador especializado en desarrollo fullstack, sistemas centralizados de datos y dashboards interactivos.',
    ogTitle: title ? `${title} | ${baseTitle}` : baseTitle,
    ogDescription: description || 'Desarrollo profesional de aplicaciones web fullstack, sistemas de datos y dashboards interactivos.',
    ogImage: '/og-image.jpg',
    twitterTitle: title ? `${title} | ${baseTitle}` : baseTitle,
    twitterDescription: description || 'Desarrollo profesional de aplicaciones web fullstack, sistemas de datos y dashboards interactivos.',
    twitterImage: '/og-image.jpg',
  };
};

/**
 * Trunca un texto a un número máximo de caracteres añadiendo puntos suspensivos
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima del texto
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
