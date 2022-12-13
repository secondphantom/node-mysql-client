import fs from "fs";
import path from "path";
import mysql from "mysql2";
import { Pool } from "mysql2/promise";
import { diff } from "deep-object-diff";
import * as jsonDiffPatch from "jsondiffpatch";
import { MysqlDataType } from "./db.schema";
import logger from "../logger/logger";
import { _ } from "../libs/fp.method";

type AnyFn<T = any> = (...args: any[]) => T;

type AllDbSchema = MysqlDataType.DbAryObjType<MysqlDataType.DbSchemaObj<any>[]>;
type ConfigSchema = MysqlDataType.DbSchema;

type Unpacked<T> = T extends (infer U)[] ? U : T;
type Optional<T> = {
  [key in keyof T]?: T[key];
};

type WhereOperator<T> = {
  [key in keyof T as T[key] extends Array<any> | undefined
    ? never
    : key]?: ConditionOperator<T[key]>;
};

interface Operator<T> {
  equal?: T;
  not?: T;
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
}

type ConditionOperator<T> = T | Operator<T>;

type MergedWhereOperator<T = any> = WhereOperator<T> & {
  OR?: [WhereOperator<T>, ...WhereOperator<T>[]];
} & {
  AND?: [WhereOperator<T>, ...WhereOperator<T>[]];
};

type FindUniqueInput<T> = {
  dbSchemaConfig: ConfigSchema;
  where?: MergedWhereOperator<T>;
  select?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key extends "tableName"
      ? never
      : key]?: boolean;
  };
  include?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? key
      : never]?: Omit<
      FindManyInput<Optional<Unpacked<T[key]>>>,
      "skip" | "take"
    >;
  } & {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key]?: FindUniqueInput<Optional<Unpacked<T[key]>>>;
  };
};

type FindManyInput<T> = {
  dbSchemaConfig: ConfigSchema;
  where?: MergedWhereOperator<T>;
  select?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key extends "tableName"
      ? never
      : key]?: boolean;
  };
  include?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? key
      : never]?: Omit<
      FindManyInput<Optional<Unpacked<T[key]>>>,
      "skip" | "take"
    >;
  } & {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key]?: FindUniqueInput<Optional<Unpacked<T[key]>>>;
  };
  orderBy?: {
    [key in keyof T as key extends "tableName" ? never : key]?: "DESC" | "ASC";
  };
  skip?: number;
  take?: number;
};

type MutationManyInput<T, U extends MutationType = any> = {
  mutationType: U;
  dbSchemaConfig: ConfigSchema;
  where?: never;
  include?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? key
      : never]?: Omit<MutationManyInput<Unpacked<T[key]>>, "mutationType">;
  };
  data: Array<{
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key extends "tableName"
      ? never
      : key]: T[key];
  }>;
  from?: never;
  select?: never;
};

type MutationSetInput<T, U extends MutationType = any> = {
  mutationType: U;
  dbSchemaConfig: ConfigSchema;
  where?: MergedWhereOperator<T>;
  include?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? key
      : never]?: Omit<MutationSetInput<Unpacked<T[key]>>, "mutationType">;
  };
  data: [
    {
      [key in keyof T as T[key] extends Array<any> | undefined
        ? never
        : MysqlDataType.CheckUndefined<T[key]> extends "NO"
        ? never
        : key extends "tableName"
        ? never
        : key]: T[key];
    }
  ];
  from?: never;
  select?: never;
};

type MutationDeleteInput<T, U extends MutationType = any> = {
  mutationType: U;
  dbSchemaConfig: ConfigSchema;
  include?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? key
      : never]?: Omit<MutationDeleteInput<Unpacked<T[key]>>, "mutationType">;
  };
  data: Array<{
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key extends "tableName"
      ? never
      : key]: T[key];
  }>;
  where?: never;
  from?: never;
  select?: never;
};

type MutationSetDelteInput<T, U extends MutationType = any> = {
  mutationType: U;
  dbSchemaConfig: ConfigSchema;
  where?: MergedWhereOperator<T>;
  include?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? key
      : never]?: Omit<MutationSetDelteInput<Unpacked<T[key]>>, "mutationType">;
  };
  data?: never;
  from?: never;
  select?: never;
};

type MutationSetInsertInput<T, U extends MutationType = any, I = any> = {
  mutationType: U;
  dbSchemaConfig: ConfigSchema;
  select?: {
    [key in keyof T as T[key] extends Array<any> | undefined
      ? never
      : key extends "tableName"
      ? never
      : key]?: boolean;
  };
  from: FindManyInput<I>;
  include?: never;
  data?: never;
  where?: never;
};

type MutationType =
  | "INSERT"
  | "UPDATE"
  | "UPSERT"
  | "DELETE"
  | "SET_UPDATE"
  | "SET_DELETE"
  | "SET_INSERT";
type MutationInput<T, U extends MutationType, I = any> = U extends "SET_UPDATE"
  ? MutationSetInput<T, U>
  : U extends "DELETE"
  ? MutationDeleteInput<T, U>
  : U extends "SET_DELETE"
  ? MutationSetDelteInput<T, U>
  : U extends "SET_INSERT"
  ? MutationSetInsertInput<T, U, I>
  : MutationManyInput<T, U>;

export type QueryStrReturn = { queryStr: string; valueAry?: any[] };

export class QueryBuilder {
  static createTable(dbSchemaConfig: ConfigSchema): string {
    const { tableName, fields } = dbSchemaConfig;
    const queryAry = [`CREATE TABLE ${tableName}\n`];
    queryAry.push("(\n");
    const fieldsConfig = Object.entries(fields);
    const primaryKeyAry: Array<string> = [];
    const uniqueSingleKeyAry: Array<string> = [];
    const uniqueMultipleKeyAry: Array<
      [
        Array<any>,
        Array<Exclude<Required<MysqlDataType.DbFieldValues>["unique"], boolean>>
      ]
    > = [];
    const indexSingleKeyAry: Array<string> = [];
    const indexMultipleKeyAry: Array<
      [
        Array<any>,
        Array<
          Exclude<Required<MysqlDataType.DbFieldValues>["indexKey"], boolean>
        >
      ]
    > = [];
    fieldsConfig.forEach(([fieldName, config], index) => {
      const {
        type,
        size,
        notNull,
        unique,
        primaryKey,
        indexKey,
        defaultValue,
        unsigned,
        autoIncrement,
        isBoolean,
        comment,
      } = config;
      queryAry.push(`\`${fieldName}\``);
      if (size) {
        queryAry.push(`${type}(${size})`);
      } else {
        queryAry.push(type);
      }
      if (unsigned) {
        queryAry.push("UNSIGNED ");
      }
      if (notNull) {
        queryAry.push("NOT NULL");
      }
      if (defaultValue) {
        if (!autoIncrement) {
          queryAry.push(`DEFAULT ${defaultValue}`);
        }
      }
      if (autoIncrement) {
        queryAry.push("AUTO_INCREMENT");
      }
      if (primaryKey) {
        primaryKeyAry.push(fieldName);
      }
      if (unique) {
        // queryAry.push("UNIQUE");
        if (typeof unique !== "object") {
          uniqueSingleKeyAry.push(fieldName);
        } else {
          const { with: otherKeys } = unique;
          unique.key = fieldName;
          if (uniqueMultipleKeyAry.length === 0) {
            uniqueMultipleKeyAry.push([[fieldName, ...otherKeys], [unique]]);
          } else {
            for (const uniqueInfo of uniqueMultipleKeyAry) {
              const [relatedKeys, uniqueAry] = uniqueInfo;
              if (relatedKeys.includes(fieldName)) {
                uniqueAry.push(unique);
              } else {
                uniqueMultipleKeyAry.push([
                  [fieldName, ...otherKeys],
                  [unique],
                ]);
              }
            }
          }
        }
      }
      if (indexKey) {
        if (typeof indexKey !== "object") {
          indexSingleKeyAry.push(fieldName);
        } else {
          const { with: otherKeys } = indexKey;
          indexKey.key = fieldName;
          if (indexMultipleKeyAry.length === 0) {
            indexMultipleKeyAry.push([[fieldName, ...otherKeys], [indexKey]]);
          } else {
            for (const indexInfo of indexMultipleKeyAry) {
              const [relatedKeys, indexKeyAry] = indexInfo;
              if (relatedKeys.includes(fieldName)) {
                indexKeyAry.push(indexKey);
              } else {
                indexMultipleKeyAry.push([
                  [fieldName, ...otherKeys],
                  [indexKey],
                ]);
              }
            }
          }
        }
      }
      if (comment) {
        if (isBoolean) {
          queryAry.push(`COMMENT 'boolean value ${comment}'`);
        } else {
          queryAry.push(`COMMENT ${comment}`);
        }
      } else {
        if (isBoolean) {
          queryAry.push(`COMMENT 'boolean value'`);
        }
      }
      if (index !== fieldsConfig.length - 1) {
        queryAry.push(",\n");
      }
    });
    queryAry.push(`,\nPRIMARY KEY (${primaryKeyAry.join(",")})`);

    if (indexSingleKeyAry.length !== 0) {
      indexSingleKeyAry.forEach((fieldName) => {
        queryAry.push(
          `,\nINDEX \`idx_${tableName}_${fieldName}\` (${fieldName})`
        );
      });
    }
    if (indexMultipleKeyAry.length !== 0) {
      indexMultipleKeyAry.forEach((indexInfo) => {
        const [relatedKeys, indexKeyAry] = indexInfo;
        indexKeyAry.sort((a, b) => {
          return a.order - b.order;
        });
        const sorttedIndexKeys = indexKeyAry.map((indexInfo) => {
          return indexInfo.key!;
        });
        queryAry.push(
          `,\nINDEX \`idx_${tableName}_${sorttedIndexKeys.join(
            "_"
          )}\` (${sorttedIndexKeys.join(", ")})`
        );
      });
    }
    if (uniqueSingleKeyAry.length !== 0) {
      uniqueSingleKeyAry.forEach((fieldName) => {
        queryAry.push(
          `,\nUNIQUE \`uq_${tableName}_${fieldName}\` (${fieldName})`
        );
      });
    }
    if (uniqueMultipleKeyAry.length !== 0) {
      uniqueMultipleKeyAry.forEach((uniqueInfo) => {
        const [relatedKeys, uniqueAry] = uniqueInfo;
        uniqueAry.sort((a, b) => {
          return a.order - b.order;
        });
        const sorttedIndexKeys = uniqueAry.map((uniqueInfo) => {
          return uniqueInfo.key!;
        });
        queryAry.push(
          `,\nUNIQUE \`uq_${tableName}_${sorttedIndexKeys.join(
            "_"
          )}\` (${sorttedIndexKeys.join(", ")})`
        );
      });
    }
    queryAry.push("\n)");
    return queryAry.join(" ");
  }
  static dropTable(dbSchemaConfig: ConfigSchema): string {
    const { tableName } = dbSchemaConfig;
    return `DROP TABLE ${tableName}`;
  }
  static createForeignKey(dbSchemaConfig: ConfigSchema): Array<string> {
    const { tableName, fields } = dbSchemaConfig;
    const queryStrAry: Array<string> = [];
    const fieldsConfig = Object.entries(fields);
    fieldsConfig.forEach(([fieldName, config]) => {
      const { foreignKey } = config;
      if (foreignKey) {
        const {
          tableName: parentTableName,
          fieldName: parentFieldName,
          symbol,
          enforced,
        } = foreignKey;
        const queryAry = [`ALTER TABLE ${tableName} ADD\n`];
        if (symbol) {
          queryAry.push(`CONSTRAINT ${symbol}\n`);
        } else {
          const symbol = `fk_${parentTableName}_${tableName}_${
            parentFieldName as string
          }`;
          queryAry.push(`CONSTRAINT ${symbol}\n`);
        }
        queryAry.push(`FOREIGN KEY (${fieldName})\n`);
        queryAry.push(
          `REFERENCES ${parentTableName} (${parentFieldName as string})\n`
        );
        if (enforced) {
          queryAry.push(`${enforced})\n`);
        }
        queryStrAry.push(queryAry.join(" "));
      }
    });
    return queryStrAry;
  }

  static dropForeignKey(dbSchemaConfig: ConfigSchema): Array<string> {
    const { tableName, fields } = dbSchemaConfig;
    const queryStrAry: Array<string> = [];
    const fieldsConfig = Object.entries(fields);
    fieldsConfig.forEach(([_, config]) => {
      const { foreignKey } = config;
      if (foreignKey) {
        const {
          tableName: parentTableName,
          fieldName: parentFieldName,
          symbol,
        } = foreignKey;
        const queryAry = [`ALTER TABLE ${tableName} DROP\n`];
        if (symbol) {
          queryAry.push(`CONSTRAINT ${symbol}\n`);
        } else {
          const symbol = `fk_${parentTableName}_${tableName}_${
            parentFieldName as string
          }`;
          queryAry.push(`CONSTRAINT ${symbol}\n`);
        }
        queryStrAry.push(queryAry.join(" "));
      }
    });
    return queryStrAry;
  }

  static convertDbValue(value: any) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 19).replace("T", " ");
    } else if (value === null) {
      return value;
    } else if (typeof value === "object") {
      return JSON.stringify(value);
    } else {
      return value;
    }
  }

  static where<T>(tableName: string, where: MergedWhereOperator<T>) {
    const params: { whereAry: string[]; whereValueAry: any[] } = {
      whereAry: [],
      whereValueAry: [],
    };

    const getAryWhere = (value: MergedWhereOperator["AND" | "OR"]) => {
      const whereAry: Array<string> = [];
      const whereValueAry: Array<any> = [];
      value!.forEach((where) => {
        const [key, value] = Object.entries(where)[0];
        if (value === null || typeof value! !== "object") {
          if (value === null) {
            whereAry.push(`\`${tableName}\`.\`${key}\` IS NULL`);
          } else {
            whereAry.push(`\`${tableName}\`.\`${key}\` = ?`);
            whereValueAry.push(QueryBuilder.convertDbValue(value));
          }
        } else {
          const result = getWhere(key, value);
          whereAry.push(...result.whereAry);
          whereValueAry.push(...result.whereValueAry);
        }
      });
      return {
        whereAry,
        whereValueAry,
      };
    };

    const getWhere = (key: string, operators: Array<any>) => {
      const whereAry: Array<string> = [];
      const whereValueAry: Array<any> = [];
      for (const [operator, value] of Object.entries(operators)) {
        let queryOperator = undefined;
        switch (operator as keyof Operator<any>) {
          case "equal":
            queryOperator = "=";
            break;
          case "gt":
            queryOperator = ">";
            break;
          case "gte":
            queryOperator = "=";
            break;
          case "lt":
            queryOperator = "<";
            break;
          case "lte":
            queryOperator = "<=";
            break;
          case "not":
            queryOperator = "!=";
            break;
        }

        if (
          value === null &&
          !(queryOperator === "=" || queryOperator === "!=")
        ) {
          throw new Error(
            "Null value are only avavilable 'equal' or 'not' operator"
          );
        }
        if (value === null) {
          if (queryOperator === "=") {
            whereAry.push(`\`${tableName}\`.\`${key}\` IS NULL`);
          } else if (queryOperator === "!=") {
            whereAry.push(`\`${tableName}\`.\`${key}\` IS NOT NULL`);
          }
        } else {
          whereAry.push(`\`${tableName}\`.\`${key}\` ${queryOperator} ?`);
          whereValueAry.push(QueryBuilder.convertDbValue(value));
        }
      }
      return {
        whereAry,
        whereValueAry,
      };
    };

    for (const [key, value] of Object.entries(where)) {
      if (key === "OR") {
        const result = getAryWhere(value);
        params.whereAry.push(`${result.whereAry.join(" OR ")}`);
        params.whereValueAry.push(...result.whereValueAry);
      } else if (key === "AND") {
        const result = getAryWhere(value);
        params.whereAry.push(`${result.whereAry.join(" AND ")}`);
        params.whereValueAry.push(...result.whereValueAry);
      } else {
        if (value === null || typeof value !== "object") {
          if (value === null) {
            params.whereAry.push(`\`${tableName}\`.\`${key}\` IS NULL`);
          } else {
            params.whereAry.push(`\`${tableName}\`.\`${key}\` = ?`);
            params.whereValueAry.push(QueryBuilder.convertDbValue(value));
          }
        } else {
          const result = getWhere(key, value);
          params.whereAry.push(`${result.whereAry.join(" AND ")}`);
          params.whereValueAry.push(...result.whereValueAry);
        }
      }
    }
    return params;
  }

  static findBuilder<T>(
    args: FindUniqueInput<T> & FindManyInput<T>,
    params:
      | undefined
      | {
          parentTableName: string | undefined;
          selectAry: Array<string>;
          whereAry: Array<string>;
          whereValueAry: Array<any>;
          joinAry: Array<string>;
          orderByAry: Array<string>;
          skipTake: Array<string>;
        } = undefined
  ) {
    if (!params) {
      params = {
        parentTableName: undefined,
        selectAry: [],
        whereAry: [],
        whereValueAry: [],
        joinAry: [],
        orderByAry: [],
        skipTake: [],
      };
    }
    const {
      dbSchemaConfig: { tableName, fields },
      include,
      select,
      where,
      orderBy,
      skip,
      take,
    } = args;

    if (select) {
      params.selectAry.push(
        ...Object.keys(select).map((key) => `\`${tableName}\`.\`${key}\``)
      );
    } else {
      params.selectAry.push(
        ...Object.keys(fields).map((key) => `\`${tableName}\`.\`${key}\``)
      );
    }

    if (where) {
      const result = QueryBuilder.where(tableName, where);
      params.whereAry.push(...result.whereAry);
      params.whereValueAry.push(...result.whereValueAry);
    }
    if (fields) {
      for (const key in fields) {
        const { foreignKey } = fields[key];
        if (foreignKey) {
          const { tableName: fkTableName, fieldName: fkFieldName } = foreignKey;
          if (params.parentTableName === fkTableName) {
            params.joinAry.push(
              `LEFT JOIN \`${tableName}\` ON \`${fkTableName}\`.\`${fkFieldName}\` = \`${tableName}\`.\`${key}\``
            );
          }
        }
      }
    }
    if (orderBy) {
      if (orderBy) {
        for (const [key, value] of Object.entries(orderBy)) {
          params.orderByAry.push(`\`${tableName}\`.\`${key}\` ${value}`);
        }
      }
    }
    if (include) {
      for (const args of Object.values(include)) {
        QueryBuilder.findBuilder<any>(
          args as FindUniqueInput<any> | FindManyInput<any>,
          { ...params, parentTableName: tableName }
        );
      }
    }
    if (take) {
      params.skipTake.push(`LIMIT ${take}`);
    }
    if (skip) {
      params.skipTake.push(`OFFSET ${skip}`);
    }
    return { ...params, parentTableName: tableName };
  }

  static find<T>(args: FindUniqueInput<T> & FindManyInput<T>): QueryStrReturn {
    const {
      selectAry,
      parentTableName,
      joinAry,
      whereAry,
      whereValueAry,
      orderByAry,
      skipTake,
    } = QueryBuilder.findBuilder(args);
    const queryStrAry = [
      `SELECT ${selectAry.length === 0 ? "*" : selectAry.join(", ")}`,
      `FROM \`${parentTableName}\``,
      joinAry.length === 0 ? null : joinAry.join(" "),
      whereAry.length === 0 ? null : `WHERE ${whereAry.join(" AND ")}`,
      orderByAry.length === 0 ? null : `ORDER BY ${orderByAry.join(", ")}`,
      skipTake.length === 0 ? null : `${skipTake.join(" ")}`,
    ];

    return { queryStr: queryStrAry.join(" "), valueAry: whereValueAry };
  }

  static mutationBuilder<T, U extends MutationType, I = any>(
    args: MutationInput<T, U, I>,
    params:
      | undefined
      | {
          mutationType: MutationType;
          dataObj: {
            [key: string]: {
              tableName: string;
              isNeedTransaction: boolean;
              lastFieldAry: string[];
              data: {
                fieldAry: string[];
                valueAry: any[];
                indexObj: { keyAry: string[]; valueAry: any[] };
                exclIndexAry: string[];
                whereAry: string[];
                whereValueAry: any[];
                fromAry?: string[];
              }[];
            };
          };
        } = undefined
  ) {
    const {
      dbSchemaConfig: { tableName, fields },
      mutationType,
      include,
      data,
      where,
      from,
      select,
    } = args;
    if (!params) {
      params = {
        mutationType,
        dataObj: {},
      };
    }

    const indexKeyAry: string[] = [];
    Object.entries(fields).forEach(([key, shcemaInfo]) => {
      if (shcemaInfo.primaryKey) {
        indexKeyAry.push(key);
      }
    });

    if (!params.dataObj[tableName]) {
      params.dataObj[tableName] = {
        tableName: tableName,
        lastFieldAry: [],
        isNeedTransaction: false,
        data: [],
      };
    }
    if (data && data.length >= 1) {
      data.forEach((dataInfo) => {
        const dataObj = params!.dataObj[tableName];
        const fieldAry: any[] = [];
        const valueAry: string[] = [];
        const indexObj: { keyAry: string[]; valueAry: any[] } = {
          keyAry: [],
          valueAry: [],
        };
        const exclIndexAry: string[] = [];

        Object.entries(dataInfo).forEach(([key, value]) => {
          const convertValue = QueryBuilder.convertDbValue(value);
          if (indexKeyAry.includes(key)) {
            indexObj.keyAry.push(key);
            indexObj.valueAry.push(convertValue);
          } else {
            exclIndexAry.push(key);
          }
          fieldAry.push(key);
          valueAry.push(convertValue);
        });
        if (dataObj.lastFieldAry.length !== 0) {
          if (
            dataObj.isNeedTransaction === false &&
            JSON.stringify(dataObj.lastFieldAry) !== JSON.stringify(fieldAry)
          ) {
            dataObj.isNeedTransaction = true;
          }
        }
        let whereResult;
        if (where) {
          whereResult = QueryBuilder.where(tableName, where);
        }

        dataObj.lastFieldAry = fieldAry;
        dataObj.data.push({
          fieldAry: fieldAry,
          valueAry: valueAry,
          indexObj: indexObj,
          exclIndexAry: exclIndexAry,
          whereAry: whereResult === undefined ? [] : whereResult.whereAry,
          whereValueAry:
            whereResult === undefined ? [] : whereResult.whereValueAry,
        });
      });
    } else {
      if (
        params.mutationType === "DELETE" ||
        params.mutationType === "SET_DELETE" ||
        params.mutationType === "SET_INSERT"
      ) {
        const dataObj = params!.dataObj[tableName];

        let whereResult;
        if (where) {
          whereResult = QueryBuilder.where(tableName, where);
        }
        let fromQueryStr: QueryStrReturn | undefined;
        if (from) {
          fromQueryStr = QueryBuilder.find<I>(
            from as FindUniqueInput<I> & FindManyInput<I>
          );
        }
        const selectAry = [];
        if (select) {
          selectAry.push(...Object.keys(select));
        } else {
          selectAry.push(...Object.keys(fields));
        }
        dataObj.lastFieldAry = [];
        dataObj.data.push({
          fieldAry: params.mutationType === "SET_INSERT" ? selectAry : [],
          valueAry: fromQueryStr ? [fromQueryStr.valueAry] : [],
          indexObj: { keyAry: [], valueAry: [] },
          exclIndexAry: [],
          whereAry: whereResult ? whereResult.whereAry : [],
          whereValueAry: whereResult ? whereResult.whereValueAry : [],
          fromAry: fromQueryStr ? [fromQueryStr.queryStr] : [],
        });
      }
    }

    if (include) {
      for (const args of Object.values(include)) {
        QueryBuilder.mutationBuilder<any, any>(
          args as MutationInput<T, U>,
          params
        );
      }
    }
    return params;
  }

  static mutation<T, U extends MutationType, I = any>(
    args: MutationInput<T, U, I>
  ): Required<QueryStrReturn>[][] {
    const { mutationType } = args;
    const { dataObj } = QueryBuilder.mutationBuilder<T, U, I>(args);
    const curQueryStrAryInfo = { index: -1, tableName: "" };
    const queryStrReturnAry: Required<QueryStrReturn>[][] = [];
    for (const tableName in dataObj) {
      const { data } = dataObj[tableName];
      data.forEach((dataInfo) => {
        const {
          fieldAry,
          valueAry,
          indexObj,
          exclIndexAry,
          whereAry,
          whereValueAry,
          fromAry,
        } = dataInfo;

        if (tableName !== curQueryStrAryInfo.tableName) {
          queryStrReturnAry.push([]);
          curQueryStrAryInfo.tableName = tableName;
          curQueryStrAryInfo.index++;
        }
        const queryAry: string[] = [];
        switch (mutationType) {
          case "INSERT":
            queryAry.push(
              `INSERT INTO \`${tableName}\` (${fieldAry
                .map((field) => {
                  return `\`${tableName}\`.\`${field}\``;
                })
                .join(", ")})\n`
            );
            queryAry.push(
              `VALUES(${fieldAry
                .map(() => {
                  return "?";
                })
                .join(", ")})`
            );
            break;
          case "UPDATE":
            queryAry.push(`UPDATE \`${tableName}\`\n`);
            queryAry.push(
              `SET ${fieldAry
                .map((field) => {
                  return `\`${field}\` = ?`;
                })
                .join(", ")}`
            );
            queryAry.push(
              `WHERE ${indexObj.keyAry
                .map((key) => {
                  return `\`${tableName}\`.\`${key}\` = ?`;
                })
                .join(" AND ")}`
            );
            valueAry.push(...indexObj.valueAry);
            break;
          case "UPSERT":
            queryAry.push(
              `INSERT INTO \`${tableName}\` (${fieldAry
                .map((field) => {
                  return `\`${field}\``;
                })
                .join(", ")})\n`
            );
            queryAry.push(
              `VALUES(${fieldAry
                .map(() => {
                  return "?";
                })
                .join(", ")}) AS NEW_VAL`
            );
            queryAry.push(`ON DUPLICATE KEY UPDATE\n`);
            if (exclIndexAry.length === 0) {
              queryAry.push(
                `${indexObj.keyAry
                  .map((key) => {
                    return `\`${tableName}\`.\`${key}\` = NEW_VAL.\`${key}\``;
                  })
                  .join(", ")}`
              );
            } else {
              queryAry.push(
                `${exclIndexAry
                  .map((key) => {
                    return `\`${tableName}\`.\`${key}\` = NEW_VAL.\`${key}\``;
                  })
                  .join(", ")}`
              );
            }
            break;
          case "SET_UPDATE":
            queryAry.push(`UPDATE \`${tableName}\`\n`);
            queryAry.push(
              `SET ${fieldAry
                .map((field) => {
                  return `\`${tableName}\`.\`${field}\` = ?`;
                })
                .join(", ")}`
            );
            if (whereAry.length !== 0) {
              queryAry.push(`WHERE ${whereAry.join(" AND ")}`);
            }
            valueAry.push(...whereValueAry);
            break;
          case "DELETE":
            queryAry.push(`DELETE FROM \`${tableName}\`\n`);
            queryAry.push(
              `WHERE ${indexObj.keyAry
                .map((key) => {
                  return `\`${tableName}\`.\`${key}\` = ?`;
                })
                .join(" AND ")}`
            );
            break;
          case "SET_DELETE":
            queryAry.push(`DELETE FROM \`${tableName}\`\n`);
            if (whereAry.length) {
              queryAry.push(`WHERE ${whereAry.join(" AND ")}`);
            }
            valueAry.push(...whereValueAry);
            break;
          case "SET_INSERT":
            queryAry.push(
              `INSERT INTO \`${tableName}\` (${fieldAry
                .map((field) => {
                  return `\`${tableName}\`.\`${field}\``;
                })
                .join(", ")})\n`
            );
            queryAry.push(...fromAry!);
            valueAry.push(...valueAry!);
            break;
        }
        queryStrReturnAry[curQueryStrAryInfo.index].push({
          queryStr: queryAry.join(" "),
          valueAry: valueAry,
        });
      });
    }
    return queryStrReturnAry;
  }

  static insertMutation = <T>(args: MutationInput<T, "INSERT">) =>
    QueryBuilder.mutation<T, "INSERT">(args);
  static updateMutation = <T>(args: MutationInput<T, "UPDATE">) =>
    QueryBuilder.mutation<T, "UPDATE">(args);
  static upsertMutation = <T>(args: MutationInput<T, "UPSERT">) =>
    QueryBuilder.mutation<T, "UPSERT">(args);
  static setUpdateMutation = <T>(args: MutationInput<T, "SET_UPDATE">) =>
    QueryBuilder.mutation<T, "SET_UPDATE">(args);
  static deleteMutation = <T>(args: MutationInput<T, "DELETE">) =>
    QueryBuilder.mutation<T, "DELETE">(args);
  static setDeleteMutation = <T>(args: MutationInput<T, "SET_DELETE">) =>
    QueryBuilder.mutation<T, "SET_DELETE">(args);
  static setInsertMutation = <T, I>(args: MutationInput<T, "SET_INSERT", I>) =>
    QueryBuilder.mutation<T, "SET_INSERT", I>(args);

  static getQueryStrWithItems<T>(
    queryFn: AnyFn,
    items: T
  ): Required<QueryStrReturn>[][] {
    return _.go([items], _.map(queryFn), _.flatten);
  }
}

export class DbClient {
  private pool: mysql.Pool;
  private promisePool: Pool;
  private dbSchemaAry;
  private presentDbSchema: MysqlDataType.DbSchemaObj<any> = {};
  constructor(
    dbSchemaAry: Array<AllDbSchema>,
    private dbSchemaPath: string,
    poolConfig: {
      host: string;
      password: string;
      user: string;
      database: string;
      connectionLimit: number;
    }
  ) {
    this.pool = mysql.createPool(poolConfig);
    this.promisePool = this.pool.promise();
    this.dbSchemaAry = dbSchemaAry;
    this.updatePresentDbSchema();
    this.initTable().then();
  }

  private updatePresentDbSchema() {
    let presentDbSchemaJson: string | undefined;
    try {
      presentDbSchemaJson = fs.readFileSync(this.dbSchemaPath, "utf-8");
      this.presentDbSchema = JSON.parse(presentDbSchemaJson as string);
      return;
    } catch (e) {
      console.error("Read DbSchema Error");
      this.presentDbSchema = {};
      return;
    }
  }

  private isDiffDbSchema(
    dbSchemaName: string,
    dbSchemaConfig: ConfigSchema,
    update: boolean
  ): boolean {
    const presentDbSchemaConfig = this.presentDbSchema[dbSchemaName];

    const diffResult = diff(presentDbSchemaConfig, dbSchemaConfig);
    if (!Object.keys(diffResult).length) return false;
    if (update) this.presentDbSchema[dbSchemaName] = dbSchemaConfig;
    return true;
  }

  private async initTable() {
    for (const dbSchemaData of this.dbSchemaAry) {
      const dbSchema = Object.entries(dbSchemaData);

      for await (const [dbSchemaName, dbSchemaConfig] of dbSchema) {
        const isDiffSchema = this.isDiffDbSchema(
          dbSchemaName,
          dbSchemaConfig,
          false
        );

        if (!isDiffSchema) continue;

        try {
          const dropForeignKeyStrAry =
            QueryBuilder.dropForeignKey(dbSchemaConfig);
          for await (const queryStr of dropForeignKeyStrAry) {
            await this.tryQuery({ queryStr: queryStr });
          }
          const dropTableQueryStr = QueryBuilder.dropTable(dbSchemaConfig);
          await this.tryQuery({ queryStr: dropTableQueryStr });
        } catch {}
        try {
          const createTableQueryStr = QueryBuilder.createTable(dbSchemaConfig);
          await this.tryQuery({ queryStr: createTableQueryStr });
        } catch {}
      }
      for (const [dbSchemaName, dbSchemaConfig] of dbSchema) {
        const isDiffSchema = this.isDiffDbSchema(
          dbSchemaName,
          dbSchemaConfig,
          true
        );
        if (!isDiffSchema) continue;
        const createForeignKeyQueryStrAry =
          QueryBuilder.createForeignKey(dbSchemaConfig);
        for await (const queryStr of createForeignKeyQueryStrAry) {
          await this.tryQuery({ queryStr: queryStr });
        }
      }
    }
    fs.writeFileSync(
      path.join(this.dbSchemaPath),
      JSON.stringify(this.presentDbSchema),
      "utf-8"
    );
  }

  async tryQuery<T>(tryQuery: QueryStrReturn): Promise<Array<T>> {
    let error = undefined;
    let resultAry: any[] = [];
    const { queryStr, valueAry } = tryQuery;
    try {
      const connection = await this.promisePool.getConnection();
      try {
        const result = await connection.query(queryStr, valueAry);

        connection.release();
        if ((result[0] as any as IterableIterator<any>)[Symbol.iterator]) {
          resultAry.push(...(result[0] as Array<T>));
        }
      } catch (e: any) {
        logger.info(queryStr);
        e.sqlMessage ? logger.error(e.sqlMessage) : logger.error(e);
        error = e;
        connection.release();
      }
    } catch (e: any) {
      error = e;
      e.sqlMessage ? logger.error(e.sqlMessage) : logger.error(e);
    }
    if (error) throw new Error(error as any);
    return resultAry;
  }

  async tryTrx(trxAry: QueryStrReturn[][]) {
    let error = undefined;
    let resultAry = [];
    try {
      const connection = await this.promisePool.getConnection();
      connection.beginTransaction();
      try {
        for await (const trx of trxAry) {
          const promiseAry = trx.map((trxInfo) => {
            return connection.query(trxInfo.queryStr, trxInfo.valueAry);
          });
          const result = await Promise.all(promiseAry);
          resultAry.push(result);
        }
        connection.commit();
      } catch (e: any) {
        connection.rollback();

        error = e;
        e.sqlMessage ? logger.error(e.sqlMessage) : logger.error(e);
      } finally {
        connection.release();
      }
    } catch (e: any) {
      error = e;
      e.sqlMessage ? logger.error(e.sqlMessage) : logger.error(e);
    }

    if (error) throw new Error(error as any);
    return resultAry;
  }
}
