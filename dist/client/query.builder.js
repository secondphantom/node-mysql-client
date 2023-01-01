"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportQueryBuilder = void 0;
const fp_method_1 = require("../libs/fp.method");
class QueryBuilder {
    static createTable(dbSchemaConfig) {
        const { tableName, fields } = dbSchemaConfig;
        const queryAry = [`CREATE TABLE ${tableName}\n`];
        queryAry.push("(\n");
        const fieldsConfig = Object.entries(fields);
        const primaryKeyAry = [];
        const uniqueSingleKeyAry = [];
        const uniqueMultipleKeyAry = [];
        const indexSingleKeyAry = [];
        const indexMultipleKeyAry = [];
        fieldsConfig.forEach(([fieldName, config], index) => {
            const { type, size, notNull, unique, primaryKey, indexKey, defaultValue, unsigned, autoIncrement, isBoolean, comment, } = config;
            queryAry.push(`\`${fieldName}\``);
            if (size) {
                queryAry.push(`${type}(${size})`);
            }
            else {
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
                }
                else {
                    const { with: otherKeys } = unique;
                    unique.key = fieldName;
                    if (uniqueMultipleKeyAry.length === 0) {
                        uniqueMultipleKeyAry.push([[fieldName, ...otherKeys], [unique]]);
                    }
                    else {
                        for (const uniqueInfo of uniqueMultipleKeyAry) {
                            const [relatedKeys, uniqueAry] = uniqueInfo;
                            if (relatedKeys.includes(fieldName)) {
                                uniqueAry.push(unique);
                            }
                            else {
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
                }
                else {
                    const { with: otherKeys } = indexKey;
                    indexKey.key = fieldName;
                    if (indexMultipleKeyAry.length === 0) {
                        indexMultipleKeyAry.push([[fieldName, ...otherKeys], [indexKey]]);
                    }
                    else {
                        for (const indexInfo of indexMultipleKeyAry) {
                            const [relatedKeys, indexKeyAry] = indexInfo;
                            if (relatedKeys.includes(fieldName)) {
                                indexKeyAry.push(indexKey);
                            }
                            else {
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
                }
                else {
                    queryAry.push(`COMMENT ${comment}`);
                }
            }
            else {
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
                queryAry.push(`,\nINDEX \`idx_${tableName}_${fieldName}\` (${fieldName})`);
            });
        }
        if (indexMultipleKeyAry.length !== 0) {
            indexMultipleKeyAry.forEach((indexInfo) => {
                const [relatedKeys, indexKeyAry] = indexInfo;
                indexKeyAry.sort((a, b) => {
                    return a.order - b.order;
                });
                const sorttedIndexKeys = indexKeyAry.map((indexInfo) => {
                    return indexInfo.key;
                });
                queryAry.push(`,\nINDEX \`idx_${tableName}_${sorttedIndexKeys.join("_")}\` (${sorttedIndexKeys.join(", ")})`);
            });
        }
        if (uniqueSingleKeyAry.length !== 0) {
            uniqueSingleKeyAry.forEach((fieldName) => {
                queryAry.push(`,\nUNIQUE \`uq_${tableName}_${fieldName}\` (${fieldName})`);
            });
        }
        if (uniqueMultipleKeyAry.length !== 0) {
            uniqueMultipleKeyAry.forEach((uniqueInfo) => {
                const [relatedKeys, uniqueAry] = uniqueInfo;
                uniqueAry.sort((a, b) => {
                    return a.order - b.order;
                });
                const sorttedIndexKeys = uniqueAry.map((uniqueInfo) => {
                    return uniqueInfo.key;
                });
                queryAry.push(`,\nUNIQUE \`uq_${tableName}_${sorttedIndexKeys.join("_")}\` (${sorttedIndexKeys.join(", ")})`);
            });
        }
        queryAry.push("\n)");
        return queryAry.join(" ");
    }
    static dropTable(dbSchemaConfig) {
        const { tableName } = dbSchemaConfig;
        return `DROP TABLE ${tableName}`;
    }
    static createForeignKey(dbSchemaConfig) {
        const { tableName, fields } = dbSchemaConfig;
        const queryStrAry = [];
        const fieldsConfig = Object.entries(fields);
        fieldsConfig.forEach(([fieldName, config]) => {
            const { foreignKey } = config;
            if (foreignKey) {
                const { tableName: parentTableName, fieldName: parentFieldName, symbol, enforced, } = foreignKey;
                const queryAry = [`ALTER TABLE ${tableName} ADD\n`];
                if (symbol) {
                    queryAry.push(`CONSTRAINT ${symbol}\n`);
                }
                else {
                    const symbol = `fk_${parentTableName}_${tableName}_${parentFieldName}`;
                    queryAry.push(`CONSTRAINT ${symbol}\n`);
                }
                queryAry.push(`FOREIGN KEY (${fieldName})\n`);
                queryAry.push(`REFERENCES ${parentTableName} (${parentFieldName})\n`);
                if (enforced) {
                    queryAry.push(`${enforced})\n`);
                }
                queryStrAry.push(queryAry.join(" "));
            }
        });
        return queryStrAry;
    }
    static dropForeignKey(dbSchemaConfig) {
        const { tableName, fields } = dbSchemaConfig;
        const queryStrAry = [];
        const fieldsConfig = Object.entries(fields);
        fieldsConfig.forEach(([_, config]) => {
            const { foreignKey } = config;
            if (foreignKey) {
                const { tableName: parentTableName, fieldName: parentFieldName, symbol, } = foreignKey;
                const queryAry = [`ALTER TABLE ${tableName} DROP\n`];
                if (symbol) {
                    queryAry.push(`CONSTRAINT ${symbol}\n`);
                }
                else {
                    const symbol = `fk_${parentTableName}_${tableName}_${parentFieldName}`;
                    queryAry.push(`CONSTRAINT ${symbol}\n`);
                }
                queryStrAry.push(queryAry.join(" "));
            }
        });
        return queryStrAry;
    }
    static convertDbValue(value) {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 19).replace("T", " ");
        }
        else if (value === null) {
            return value;
        }
        else if (typeof value === "object") {
            return JSON.stringify(value);
        }
        else {
            return value;
        }
    }
    static where(tableName, where) {
        const params = {
            whereAry: [],
            whereValueAry: [],
        };
        const getAryWhere = (value) => {
            const whereAry = [];
            const whereValueAry = [];
            value.forEach((where) => {
                const [key, value] = Object.entries(where)[0];
                if (value === null || typeof value !== "object") {
                    if (value === null) {
                        whereAry.push(`\`${tableName}\`.\`${key}\` IS NULL`);
                    }
                    else {
                        whereAry.push(`\`${tableName}\`.\`${key}\` = ?`);
                        whereValueAry.push(QueryBuilder.convertDbValue(value));
                    }
                }
                else {
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
        const getWhere = (key, operators) => {
            const whereAry = [];
            const whereValueAry = [];
            for (const [operator, value] of Object.entries(operators)) {
                let queryOperator = undefined;
                switch (operator) {
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
                if (value === null &&
                    !(queryOperator === "=" || queryOperator === "!=")) {
                    throw new Error("Null value are only avavilable 'equal' or 'not' operator");
                }
                if (value === null) {
                    if (queryOperator === "=") {
                        whereAry.push(`\`${tableName}\`.\`${key}\` IS NULL`);
                    }
                    else if (queryOperator === "!=") {
                        whereAry.push(`\`${tableName}\`.\`${key}\` IS NOT NULL`);
                    }
                }
                else {
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
            }
            else if (key === "AND") {
                const result = getAryWhere(value);
                params.whereAry.push(`${result.whereAry.join(" AND ")}`);
                params.whereValueAry.push(...result.whereValueAry);
            }
            else {
                if (value === null || typeof value !== "object") {
                    if (value === null) {
                        params.whereAry.push(`\`${tableName}\`.\`${key}\` IS NULL`);
                    }
                    else {
                        params.whereAry.push(`\`${tableName}\`.\`${key}\` = ?`);
                        params.whereValueAry.push(QueryBuilder.convertDbValue(value));
                    }
                }
                else {
                    const result = getWhere(key, value);
                    params.whereAry.push(`${result.whereAry.join(" AND ")}`);
                    params.whereValueAry.push(...result.whereValueAry);
                }
            }
        }
        return params;
    }
    static findBuilder(args, params = undefined) {
        if (!params) {
            params = {
                parentTableName: undefined,
                parentForeignKeys: [],
                selectAry: [],
                whereAry: [],
                whereValueAry: [],
                joinAry: [],
                orderByAry: [],
                skipTake: [],
            };
        }
        const { dbSchemaConfig: { tableName, fields }, include, select, where, orderBy, skip, take, } = args;
        if (select) {
            params.selectAry.push(...Object.keys(select).map((key) => `\`${tableName}\`.\`${key}\``));
        }
        else {
            params.selectAry.push(...Object.keys(fields).map((key) => `\`${tableName}\`.\`${key}\``));
        }
        if (where) {
            const result = QueryBuilder.where(tableName, where);
            params.whereAry.push(...result.whereAry);
            params.whereValueAry.push(...result.whereValueAry);
        }
        const parentForeignKeys = [];
        if (fields) {
            for (const key in fields) {
                const { foreignKey } = fields[key];
                if (foreignKey) {
                    parentForeignKeys.push({ ...foreignKey, parentKey: key });
                    const { tableName: fkTableName, fieldName: fkFieldName } = foreignKey;
                    if (params.parentTableName === fkTableName) {
                        params.joinAry.push(`LEFT JOIN \`${tableName}\` ON \`${fkTableName}\`.\`${fkFieldName}\` = \`${tableName}\`.\`${key}\``);
                    }
                }
                else {
                    for (const foreignKey of params.parentForeignKeys) {
                        const { tableName: fkTableName, fieldName: fkFieldName, parentKey, } = foreignKey;
                        if (tableName === fkTableName && key === fkFieldName) {
                            params.joinAry.push(`LEFT JOIN \`${tableName}\` ON \`${fkTableName}\`.\`${fkFieldName}\` = \`${params.parentTableName}\`.\`${parentKey}\``);
                        }
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
                QueryBuilder.findBuilder(args, { ...params, parentTableName: tableName, parentForeignKeys });
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
    static find(args) {
        const { selectAry, parentTableName, joinAry, whereAry, whereValueAry, orderByAry, skipTake, } = QueryBuilder.findBuilder(args);
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
    static mutationBuilder(args, params = undefined) {
        const { dbSchemaConfig: { tableName, fields }, mutationType, include, data, where, from, select, } = args;
        if (!params) {
            params = {
                mutationType,
                dataObj: {},
            };
        }
        const indexKeyAry = [];
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
                const dataObj = params.dataObj[tableName];
                const fieldAry = [];
                const valueAry = [];
                const indexObj = {
                    keyAry: [],
                    valueAry: [],
                };
                const exclIndexAry = [];
                Object.entries(dataInfo).forEach(([key, value]) => {
                    const convertValue = QueryBuilder.convertDbValue(value);
                    if (indexKeyAry.includes(key)) {
                        indexObj.keyAry.push(key);
                        indexObj.valueAry.push(convertValue);
                    }
                    else {
                        exclIndexAry.push(key);
                    }
                    fieldAry.push(key);
                    valueAry.push(convertValue);
                });
                if (dataObj.lastFieldAry.length !== 0) {
                    if (dataObj.isNeedTransaction === false &&
                        JSON.stringify(dataObj.lastFieldAry) !== JSON.stringify(fieldAry)) {
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
                    whereValueAry: whereResult === undefined ? [] : whereResult.whereValueAry,
                });
            });
        }
        else {
            if (params.mutationType === "DELETE" ||
                params.mutationType === "SET_DELETE" ||
                params.mutationType === "SET_INSERT") {
                const dataObj = params.dataObj[tableName];
                let whereResult;
                if (where) {
                    whereResult = QueryBuilder.where(tableName, where);
                }
                let fromQueryStr;
                if (from) {
                    fromQueryStr = QueryBuilder.find(from);
                }
                const selectAry = [];
                if (select) {
                    selectAry.push(...Object.keys(select));
                }
                else {
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
                QueryBuilder.mutationBuilder(args, params);
            }
        }
        return params;
    }
    static mutation(args) {
        const { mutationType } = args;
        const { dataObj } = QueryBuilder.mutationBuilder(args);
        const curQueryStrAryInfo = { index: -1, tableName: "" };
        const queryStrReturnAry = [];
        for (const tableName in dataObj) {
            const { data } = dataObj[tableName];
            data.forEach((dataInfo) => {
                const { fieldAry, valueAry, indexObj, exclIndexAry, whereAry, whereValueAry, fromAry, } = dataInfo;
                if (tableName !== curQueryStrAryInfo.tableName) {
                    queryStrReturnAry.push([]);
                    curQueryStrAryInfo.tableName = tableName;
                    curQueryStrAryInfo.index++;
                }
                const queryAry = [];
                switch (mutationType) {
                    case "INSERT":
                        queryAry.push(`INSERT INTO \`${tableName}\` (${fieldAry
                            .map((field) => {
                            return `\`${tableName}\`.\`${field}\``;
                        })
                            .join(", ")})\n`);
                        queryAry.push(`VALUES(${fieldAry
                            .map(() => {
                            return "?";
                        })
                            .join(", ")})`);
                        break;
                    case "UPDATE":
                        queryAry.push(`UPDATE \`${tableName}\`\n`);
                        queryAry.push(`SET ${fieldAry
                            .map((field) => {
                            return `\`${field}\` = ?`;
                        })
                            .join(", ")}`);
                        queryAry.push(`WHERE ${indexObj.keyAry
                            .map((key) => {
                            return `\`${tableName}\`.\`${key}\` = ?`;
                        })
                            .join(" AND ")}`);
                        valueAry.push(...indexObj.valueAry);
                        break;
                    case "UPSERT":
                    case "ADD_UPSERT":
                        queryAry.push(`INSERT INTO \`${tableName}\` (${fieldAry
                            .map((field) => {
                            return `\`${field}\``;
                        })
                            .join(", ")})\n`);
                        queryAry.push(`VALUES(${fieldAry
                            .map(() => {
                            return "?";
                        })
                            .join(", ")}) AS NEW_VAL`);
                        queryAry.push(`ON DUPLICATE KEY UPDATE\n`);
                        if (exclIndexAry.length === 0) {
                            queryAry.push(`${indexObj.keyAry
                                .map((key) => {
                                return `\`${tableName}\`.\`${key}\` = NEW_VAL.\`${key}\``;
                            })
                                .join(", ")}`);
                        }
                        else {
                            queryAry.push(`${exclIndexAry
                                .map((key) => {
                                if (mutationType === "ADD_UPSERT") {
                                    return `\`${tableName}\`.\`${key}\` = NEW_VAL.\`${key}\`+\`${tableName}\`.\`${key}\``;
                                }
                                return `\`${tableName}\`.\`${key}\` = NEW_VAL.\`${key}\``;
                            })
                                .join(", ")}`);
                        }
                        break;
                    case "SET_UPDATE":
                        queryAry.push(`UPDATE \`${tableName}\`\n`);
                        queryAry.push(`SET ${fieldAry
                            .map((field) => {
                            return `\`${tableName}\`.\`${field}\` = ?`;
                        })
                            .join(", ")}`);
                        if (whereAry.length !== 0) {
                            queryAry.push(`WHERE ${whereAry.join(" AND ")}`);
                        }
                        valueAry.push(...whereValueAry);
                        break;
                    case "DELETE":
                        queryAry.push(`DELETE FROM \`${tableName}\`\n`);
                        queryAry.push(`WHERE ${indexObj.keyAry
                            .map((key) => {
                            return `\`${tableName}\`.\`${key}\` = ?`;
                        })
                            .join(" AND ")}`);
                        break;
                    case "SET_DELETE":
                        queryAry.push(`DELETE FROM \`${tableName}\`\n`);
                        if (whereAry.length) {
                            queryAry.push(`WHERE ${whereAry.join(" AND ")}`);
                        }
                        valueAry.push(...whereValueAry);
                        break;
                    case "SET_INSERT":
                        queryAry.push(`INSERT INTO \`${tableName}\` (${fieldAry
                            .map((field) => {
                            return `\`${tableName}\`.\`${field}\``;
                        })
                            .join(", ")})\n`);
                        queryAry.push(...fromAry);
                        valueAry.push(...whereValueAry);
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
    static insertMutation = (args) => QueryBuilder.mutation(args);
    static updateMutation = (args) => QueryBuilder.mutation(args);
    static upsertMutation = (args) => QueryBuilder.mutation(args);
    static setUpdateMutation = (args) => QueryBuilder.mutation(args);
    static deleteMutation = (args) => QueryBuilder.mutation(args);
    static setDeleteMutation = (args) => QueryBuilder.mutation(args);
    static setInsertMutation = (args) => QueryBuilder.mutation(args);
    static addUpsertMutation = (args) => QueryBuilder.mutation(args);
    static getQueryStrWithItems(queryFn, items) {
        return fp_method_1._.go([items], fp_method_1._.map(queryFn), fp_method_1._.flatten);
    }
}
exports.default = QueryBuilder;
class ExportQueryBuilder {
    static find = QueryBuilder.find;
    static mutation = QueryBuilder.mutation;
    static insertMutation = QueryBuilder.insertMutation;
    static updateMutation = QueryBuilder.updateMutation;
    static upsertMutation = QueryBuilder.upsertMutation;
    static deleteMutation = QueryBuilder.deleteMutation;
    static setUpdateMutation = QueryBuilder.setUpdateMutation;
    static setDeleteMutation = QueryBuilder.setDeleteMutation;
    static setInsertMutation = QueryBuilder.setInsertMutation;
    static addUpsertMutation = QueryBuilder.addUpsertMutation;
    static getQueryStrWithItems = QueryBuilder.getQueryStrWithItems;
}
exports.ExportQueryBuilder = ExportQueryBuilder;
