/* 
  ex: filters = {
    name: "John",
    age: { operator: ">", value: 30 },
    status: { operator: "IN", value: ["active", "pending"] },
    description: { operator: "LIKE", value: "test" },
    deleted_at: null,
  }
*/

export const buildWhere = (filters = {}, startIndex = 1) => {
  const conditions = [];
  const values = [];
  let index = startIndex;

  Object.entries(filters).forEach(([field, config]) => {
    // Handle null/undefined as IS NULL
    if (config === undefined || config === null) {
      conditions.push(`${field} IS NULL`);
      return;
    }

    // Simple equality if config is not an object
    if (typeof config !== "object") {
      conditions.push(`${field} = $${index++}`);
      values.push(config);
      return;
    }

    // Handle operators
    const { operator = "=", value } = config;

    // Skip undefined/null values for operators that require a value
    if (value === undefined || value === null) return;

    // Handle IN operator with array values
    if (operator.toUpperCase() === "IN" && Array.isArray(value)) {
      conditions.push(`${field} = ANY($${index++})`);
      values.push(value);
      return;
    }

    // Handle LIKE operator with case-insensitive search
    if (operator.toUpperCase() === "LIKE") {
      conditions.push(`${field} ILIKE $${index++}`);
      values.push(`%${value}%`);
      return;
    }

    conditions.push(`${field} ${operator} $${index++}`);
    values.push(value);
  });

  return {
    where: conditions.length ? conditions.join(" AND ") : "",
    values,
    nextIndex: index,
  };
};
