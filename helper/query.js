import { pool } from "../config/db.js";
import { buildWhere } from "../helper/build-where.js";
import { toCamelCase } from "../helper/camel-case.js";
import { pickAllowedFields } from "./allowed-fields.js";
import { errorResp } from "./response.js";
import { toSnakeCase } from "./snake-case.js";

const getPgType = (col) => {
  const typeMap = {
    id: "uuid",
    total_trip_count: "int",
  };

  return typeMap[col] || "text";
};

export const paginate = async ({
  table,
  alias = "",
  select = ["*"],
  relations = [],
  filters = {},
  orderBy = "id DESC",
  page = 1,
  limit = 10,
}) => {
  const offset = (page - 1) * limit;

  const baseTable = alias ? `${table} ${alias}` : table;

  // 🔹 Build JOIN
  const joinQuery = relations
    .map((rel) => {
      const joinType = rel.type || "LEFT";
      return `
        ${joinType} JOIN ${rel.table} ${rel.alias}
        ON ${rel.on}
      `;
    })
    .join(" ");

  // 🔹 Build SELECT
  const selectFields = [
    ...(Array.isArray(select) ? select : [select]),
    ...relations.flatMap((r) => r.select || []),
  ].join(", ");

  // 🔹 Build WHERE
  const { where, values } = buildWhere(filters);
  const whereClause = where ? `WHERE ${where}` : "";

  // 🔹 Count (tanpa select relation fields)
  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM ${baseTable}
      ${whereClause}
    `,
    values,
  );

  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit);

  // 🔹 Data
  const { rows } = await pool.query(
    `
      SELECT ${selectFields}
      FROM ${baseTable}
      ${joinQuery}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `,
    [...values, limit, offset],
  );

  return {
    rows: toCamelCase(rows),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const selectAll = async ({
  table,
  alias = "",
  select = ["*"],
  relations = [],
  filters = {},
  orderBy = "id DESC",
}) => {
  const baseTable = alias ? `${table} ${alias}` : table;

  const joinQuery = relations
    .map((rel) => {
      const joinType = rel.type || "LEFT";
      return `
        ${joinType} JOIN ${rel.table} ${rel.alias}
        ON ${rel.on}
      `;
    })
    .join(" ");

  const selectFields = [
    ...(Array.isArray(select) ? select : [select]),
    ...relations.flatMap((r) => r.select || []),
  ].join(", ");

  const { where, values } = buildWhere(filters);
  const whereClause = where ? `WHERE ${where}` : "";

  const { rows } = await pool.query(
    `
      SELECT ${selectFields}
      FROM ${baseTable}
      ${joinQuery}
      ${whereClause}
      ORDER BY ${orderBy}
    `,
    values,
  );

  return toCamelCase(rows);
};

export const insertOne = async ({
  table,
  data,
  allowedPayload = [],
  relations = [],
  returning = "*",
  client = pool,
}) => {
  // 🔐 whitelist column
  const filteredData = pickAllowedFields(data, allowedPayload);

  const fields = Object.keys(filteredData);
  const values = Object.values(filteredData);

  const columns = fields.map(toSnakeCase).join(", ");
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

  const { rows } = await client.query(
    `INSERT INTO ${table} (${columns})
     VALUES (${placeholders})
     RETURNING ${returning}`,
    values,
  );

  const inserted = rows[0];

  // 🔗 Insert relations
  for (const rel of relations) {
    if (!rel.data?.length) continue;

    const relationData = rel.data.map((row) => ({
      ...row,
      [rel.foreignKey]: inserted[rel.sourceKey || "id"],
    }));

    if (rel.isBulkUpdate) {
      await bulkUpdate({
        table: rel.table,
        rowsData: rel.data,
        key: rel.key || "id",
        allowedColumns: rel.allowedPayload,
        client,
      });
    } else {
      await bulkInsert({
        table: rel.table,
        rowsData: relationData,
        allowedPayload: rel.allowedPayload,
        client,
      });
    }
  }

  return inserted;
};

export const updateOne = async ({
  table,
  data,
  filters,
  allowedPayload = [],
  relations = [],
  returning = "*",
  client = pool,
  res = null,
}) => {
  // 🔐 whitelist column
  const filteredData = pickAllowedFields(data, allowedPayload);

  const fields = Object.keys(filteredData);
  const values = Object.values(filteredData);

  const columns = fields.map(toSnakeCase).join(", ");
  const setQuery = fields
    .map((f, i) => `${toSnakeCase(f)} = $${i + 1}`)
    .join(", ");

  const { where, values: whereValues } = buildWhere(filters, fields.length + 1);

  const { rows } = await client.query(
    `
      UPDATE ${table}
      SET ${setQuery}
      WHERE ${where}
      RETURNING ${returning}
    `,
    [...values, ...whereValues],
  );

  if (!rows.length) {
    return errorResp(
      res,
      `Data with specified filters does not exist`,
      "VALIDATION_ERROR",
      404,
    );
  }

  const updated = rows[0];

  // 🔗 Sync relation (delete + insert)
  for (const rel of relations) {
    if (!rel.data) continue;

    await client.query(
      `DELETE FROM ${rel.table} WHERE ${toSnakeCase(rel.foreignKey)} = $1`,
      [updated[rel.sourceKey || "id"]],
    );

    if (rel.data.length) {
      const relationData = rel.data.map((row) => ({
        ...row,
        [rel.foreignKey]: updated[rel.sourceKey || "id"],
      }));

      await bulkInsert({
        table: rel.table,
        rowsData: relationData,
        allowedPayload: rel.allowedPayload,
        client,
      });
    }
  }

  return updated;
};

export const bulkUpdate = async ({
  table,
  rowsData,
  key = "id", // primary key
  allowedColumns = [],
  client = pool,
}) => {
  if (!rowsData?.length) return;

  // 🔐 whitelist & validate
  const filteredRows = rowsData.map((row) => {
    const filtered = {};

    allowedColumns.forEach((col) => {
      if (row[col] !== undefined) {
        filtered[col] = row[col];
      }
    });

    // wajib ada key
    if (!row[key]) {
      throw new Error(`Missing primary key: ${key}`);
    }

    filtered[key] = row[key];

    return filtered;
  });

  const columns = [key, ...allowedColumns];

  const values = [];
  const valuePlaceholders = filteredRows
    .map((row, rowIndex) => {
      const offset = rowIndex * columns.length;

      values.push(...columns.map((col) => row[col]));

      return `(${columns
        .map((col, i) => {
          const index = offset + i + 1;
          const type = getPgType(col);

          return type ? `$${index}::${type}` : `$${index}`;
        })
        .join(", ")})`;
    })
    .join(", ");

  const setClause = allowedColumns
    .map((col) => `${toSnakeCase(col)} = v.${col}`)
    .join(", ");

  const query = `
    UPDATE ${table} t
    SET ${setClause}
    FROM (
      VALUES ${valuePlaceholders}
    ) AS v(${columns.join(", ")})
    WHERE t.${key} = v.${key}
  `;

  console.log("Bulk Update Query:", query, values);

  await client.query(query, values);
};

export const bulkInsert = async ({
  table,
  rowsData,
  allowedPayload = [],
  client = pool,
}) => {
  if (!rowsData.length) return;

  const filteredRows = rowsData.map((row) =>
    pickAllowedFields(row, allowedPayload),
  );

  const fields = Object.keys(filteredRows[0]);
  const columns = fields.map(toSnakeCase).join(", ");

  const values = [];
  const placeholders = filteredRows
    .map((row, rowIndex) => {
      const offset = rowIndex * fields.length;

      values.push(...fields.map((f) => row[f]));

      return `(${fields.map((_, i) => `$${offset + i + 1}`).join(", ")})`;
    })
    .join(", ");

  await client.query(
    `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`,
    values,
  );
};

export const deleteOne = async ({ table, filters }) => {
  const { where, values } = buildWhere(filters);
  await pool.query(`DELETE FROM ${table} WHERE ${where}`, values);
};

export const deleteCascade = async ({
  table,
  filters,
  relations = [],
  client = pool,
}) => {
  const { where, values } = buildWhere(filters);

  // Get IDs of rows to be deleted
  const { rows } = await client.query(
    `SELECT id FROM ${table} WHERE ${where}`,
    values,
  );
  const ids = rows.map((row) => row.id);

  if (!ids.length) return;

  // Delete level 2 (nested relations)
  for (const rel of relations) {
    if (rel.relations?.length) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");

      // Get IDs from level 1 relations
      const { rows: relRows } = await client.query(
        `SELECT id FROM ${rel.table} WHERE ${rel.foreignKey} IN (${placeholders})`,
        ids,
      );
      const relIds = relRows.map((row) => row.id);

      // Delete level 2 relations
      for (const nested of rel.relations) {
        if (relIds.length) {
          const nestedPlaceholders = relIds
            .map((_, i) => `$${i + 1}`)
            .join(", ");
          await client.query(
            `DELETE FROM ${nested.table} WHERE ${nested.foreignKey} IN (${nestedPlaceholders})`,
            relIds,
          );
        }
      }
    }

    // Delete level 1 relations
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await client.query(
      `DELETE FROM ${rel.table} WHERE ${rel.foreignKey} IN (${placeholders})`,
      ids,
    );
  }

  // Delete parent
  await client.query(`DELETE FROM ${table} WHERE ${where}`, values);
};

/*
 */

export const softDelete = async ({ table, filters, deletedBy = null }) => {
  const { where, values } = buildWhere(filters);
  await pool.query(
    `UPDATE ${table} SET deleted_at = NOW(), deleted_by = $${values.length + 1} WHERE ${where}`,
    [...values, deletedBy],
  );
};

export const softDeleteCascade = async ({
  table,
  filters,
  relations = [],
  deletedBy = null,
  client = pool,
}) => {
  // 🔹 Build where
  const { where, values } = buildWhere(filters);

  if (!where) {
    throw new Error("Soft delete requires filter");
  }

  // 🔹 Soft delete parent & get affected rows
  const { rows } = await client.query(
    `
      UPDATE ${table}
      SET deleted_at = NOW(), deleted_by = $${values.length + 1}
      WHERE ${where}
      RETURNING *
    `,
    [...values, deletedBy],
  );

  if (!rows.length) return [];

  // 🔹 Cascade soft delete
  for (const rel of relations) {
    for (const row of rows) {
      const parentId = row[rel.sourceKey || "id"];

      await client.query(
        `
          UPDATE ${rel.table}
          SET deleted_at = NOW(), deleted_by = $${values.length + 1}
          WHERE ${rel.foreignKey} = $1
        `,
        [parentId, deletedBy],
      );
    }
  }

  return rows;
};

/* 
// Example usage:

// Pagination with relations
const { rows, pagination } = await paginate({
  table: "categories",
    alias: "c",
    select: ["c.id", "c.label", "c.value", "c.code"],
    relations: [
        {
            table: "category_tags",
            alias: "ct",
            type: "LEFT",
            on: "ct.category_id = c.id",
            select: ["ct.tag"],
        },
    ],
    filters: {
        label: { operator: "LIKE", value: "adventure" },
        deleted_at: null,
    },
    orderBy: "c.created_at DESC",
    page: 1,
    limit: 10,
});

// Select all with relations
const categories = await selectAll({
    table: "categories",
    alias: "c",
    select: ["c.id", "c.label", "c.value", "c.code"],
    relations: [
        {
            table: "category_tags",
            alias: "ct",
            type: "LEFT",
            on: "ct.category_id = c.id",
            select: ["ct.tag"],
        },
    ],
    filters: {
        label: { operator: "LIKE", value: "adventure" },
        deleted_at: null,
    },
    orderBy: "c.label ASC",
});

// Insert with relations
const newCategory = await insertOne({
  table: "categories",
  data: { label: "Adventure", value: "adventure", code: "ADV" },
  allowedPayload: ["id", "label", "value", "code"],
  relations: [
    {
      table: "category_tags",
      foreignKey: "category_id",
      allowedPayload: ["category_id", "tag"],
      data: [{ tag: "outdoor" }, { tag: "nature" }],
    },
  ],
});

// Update
const updatedCategory = await updateOne({
  table: "categories",
  data: { label: "Updated Adventure", value: "updated-adventure", code: "UPD" },
  filters: { id: newCategory.id },
  allowedPayload: ["id", "label", "value", "code"],
  relations: [
    {
      table: "category_tags",
      foreignKey: "category_id",
      allowedPayload: ["category_id", "tag"],
      data: [{ tag: "updated-outdoor" }, { tag: "updated-nature" }],
    },
  ],
});

// Bulk update
await bulkUpdate({
  table: "traveler",
  rowsData: [
    { id: "traveler-uuid-1", total_trip_count: 5 },
    { id: "traveler-uuid-2", total_trip_count: 3 },
  ],
  key: "id",
  allowedColumns: ["total_trip_count"],
});

// Hard delete cascade
deleteCascade({
  table: "trip_transaction",
  filters: { id },
  relations: [
    {
      table: "trip_traveler",
      foreignKey: "trip_transaction_id",
      relations: [
        {
          table: "trip_traveler_document",
          foreignKey: "trip_traveler_id",
        },
      ],
    },
    {
      table: "trip_transaction_payment",
      foreignKey: "trip_transaction_id",
    },
  ],
});

// Soft delete
await softDelete({
  table: "categories",
  filters: { id: newCategory.id },
  deletedBy: "admin_user_id",
});

// Soft delete cascade
await softDeleteCascade({
  table: "categories",
  filters: { id: newCategory.id },
  deletedBy: "admin_user_id",
  relations: [
    {
      table: "category_tags",
      foreignKey: "category_id",
    },
  ],
});
*/
