export const toSnakeCase = (str) =>
  str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
