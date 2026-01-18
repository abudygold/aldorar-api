import camelcaseKeys from "camelcase-keys";

export const toCamel = (data) => camelcaseKeys(data, { deep: true });
