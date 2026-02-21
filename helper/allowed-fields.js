export const pickAllowedFields = (data, allowedColumns = []) => {
  const filtered = {};

  allowedColumns.forEach((key) => {
    if (data[key] !== undefined) {
      filtered[key] = data[key];
    }
  });

  return filtered;
};
