import camelcaseKeys from "camelcase-keys";

export const toCamelCase = (data) => camelcaseKeys(data, { deep: true });
