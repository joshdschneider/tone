export function getHoistedGreetingContent(language?: string) {
  switch (language) {
    case 'en':
    case 'en-US':
      return `Hello?`;
    case 'es':
      return `¿Aló?`;
    default:
      return `Hello?`;
  }
}

export function getDefaultGreeting(language?: string) {
  switch (language) {
    case 'en':
    case 'en-US':
      return `Hi there! How can I help you?`;
    case 'es':
      return `¡Hola! ¿En qué puedo ayudarte hoy?`;
    default:
      return `Hi there! How can I help you?`;
  }
}
