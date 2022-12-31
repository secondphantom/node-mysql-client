"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const deep_object_diff_1 = require("deep-object-diff");
const db_light_client_1 = __importDefault(require("./db.light.client"));
const query_builder_1 = __importDefault(require("./query.builder"));
class DbClient extends db_light_client_1.default {
    dbSchemaAry;
    dbSchemaPath;
    presentDbSchema = {};
    constructor(poolConfig, dbSchemaAry, dbSchemaPath) {
        super(poolConfig);
        this.dbSchemaAry = dbSchemaAry;
        this.dbSchemaPath = dbSchemaPath;
        this.updatePresentDbSchema();
        this.initTable().then();
    }
    updatePresentDbSchema() {
        let presentDbSchemaJson;
        try {
            presentDbSchemaJson = fs_1.default.readFileSync(this.dbSchemaPath, "utf-8");
            this.presentDbSchema = JSON.parse(presentDbSchemaJson);
            return;
        }
        catch (e) {
            console.error("Read DbSchema Error");
            this.presentDbSchema = {};
            return;
        }
    }
    isDiffDbSchema(dbSchemaName, dbSchemaConfig, update) {
        const presentDbSchemaConfig = this.presentDbSchema[dbSchemaName];
        const diffResult = (0, deep_object_diff_1.diff)(presentDbSchemaConfig, dbSchemaConfig);
        if (!Object.keys(diffResult).length)
            return false;
        if (update)
            this.presentDbSchema[dbSchemaName] = dbSchemaConfig;
        return true;
    }
    async initTable() {
        for (const dbSchemaData of this.dbSchemaAry) {
            const dbSchema = Object.entries(dbSchemaData);
            for await (const [dbSchemaName, dbSchemaConfig] of dbSchema) {
                const isDiffSchema = this.isDiffDbSchema(dbSchemaName, dbSchemaConfig, false);
                if (!isDiffSchema)
                    continue;
                try {
                    const dropForeignKeyStrAry = query_builder_1.default.dropForeignKey(dbSchemaConfig);
                    for await (const queryStr of dropForeignKeyStrAry) {
                        await this.tryQuery({ queryStr: queryStr });
                    }
                    const dropTableQueryStr = query_builder_1.default.dropTable(dbSchemaConfig);
                    await this.tryQuery({ queryStr: dropTableQueryStr });
                }
                catch { }
                try {
                    const createTableQueryStr = query_builder_1.default.createTable(dbSchemaConfig);
                    await this.tryQuery({ queryStr: createTableQueryStr });
                }
                catch { }
            }
            for (const [dbSchemaName, dbSchemaConfig] of dbSchema) {
                const isDiffSchema = this.isDiffDbSchema(dbSchemaName, dbSchemaConfig, true);
                if (!isDiffSchema)
                    continue;
                const createForeignKeyQueryStrAry = query_builder_1.default.createForeignKey(dbSchemaConfig);
                for await (const queryStr of createForeignKeyQueryStrAry) {
                    await this.tryQuery({ queryStr: queryStr });
                }
            }
        }
        fs_1.default.writeFileSync(path_1.default.join(this.dbSchemaPath), JSON.stringify(this.presentDbSchema), "utf-8");
    }
}
exports.default = DbClient;
