import fs from "fs";
import path from "path";

import mysql from "mysql2";
import { diff } from "deep-object-diff";

import DbLightClient, { AllDbSchema, ConfigSchema } from "./db.light.client";
import { MysqlDataType } from "./db.schema";
import QueryBuilder from "./query.builder";

export default class DbClient extends DbLightClient {
  private presentDbSchema: MysqlDataType.DbSchemaObj<any> = {};
  constructor(
    poolConfig: mysql.PoolOptions,
    private dbSchemaAry: Array<AllDbSchema>,
    private dbSchemaPath: string
  ) {
    super(poolConfig);
    this.updatePresentDbSchema();
    this.initTable().then();
  }

  private updatePresentDbSchema = () => {
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
  };

  private isDiffDbSchema = (
    dbSchemaName: string,
    dbSchemaConfig: ConfigSchema,
    update: boolean
  ): boolean => {
    const presentDbSchemaConfig = this.presentDbSchema[dbSchemaName];

    const diffResult = diff(presentDbSchemaConfig, dbSchemaConfig);
    if (!Object.keys(diffResult).length) return false;
    if (update) this.presentDbSchema[dbSchemaName] = dbSchemaConfig;
    return true;
  };

  private initTable = async () => {
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
  };
}
