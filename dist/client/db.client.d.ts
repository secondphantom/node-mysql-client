import mysql from "mysql2";
import DbLightClient, { AllDbSchema } from "./db.light.client";
export default class DbClient extends DbLightClient {
    private dbSchemaAry;
    private dbSchemaPath;
    private presentDbSchema;
    constructor(poolConfig: mysql.PoolOptions, dbSchemaAry: Array<AllDbSchema>, dbSchemaPath: string);
    private updatePresentDbSchema;
    private isDiffDbSchema;
    private initTable;
}
