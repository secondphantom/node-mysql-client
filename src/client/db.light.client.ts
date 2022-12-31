import mysql from "mysql2";
import { Pool, PoolConnection } from "mysql2/promise";
import logger from "../logger/logger";
import { _ } from "../libs/fp.method";

import { QueryStrReturn } from "./query.builder";
import { MysqlDataType } from "./db.schema";

export type AllDbSchema = MysqlDataType.DbAryObjType<
  MysqlDataType.DbSchemaObj<any>[]
>;
export type ConfigSchema = MysqlDataType.DbSchema;

export default class DbLightClient {
  private pool: mysql.Pool;
  private promisePool: Pool;

  constructor(poolConfig: mysql.PoolOptions) {
    this.pool = mysql.createPool(poolConfig);
    this.promisePool = this.pool.promise();
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
      await connection.beginTransaction();
      try {
        for await (const trx of trxAry) {
          const promiseAry = trx.map((trxInfo) => {
            return connection.query(trxInfo.queryStr, trxInfo.valueAry);
          });
          const result = await Promise.all(promiseAry);
          resultAry.push(result);
        }
        await connection.commit();
      } catch (e: any) {
        await connection.rollback();

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

  async beginTrx() {
    const connection = await this.promisePool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  async commitTrx(connection: PoolConnection) {
    await connection.commit();
    connection.release();
  }

  async errorTrx(connection: PoolConnection) {
    await connection.rollback();
    connection.release();
  }

  async trxWithConnection(
    connection: PoolConnection,
    trxAry: QueryStrReturn[][]
  ) {
    let resultAry = [];
    for await (const trx of trxAry) {
      const promiseAry = trx.map((trxInfo) => {
        return connection.query(trxInfo.queryStr, trxInfo.valueAry);
      });
      const result = await Promise.all(promiseAry);

      resultAry.push(result);
    }
    return resultAry;
  }

  async queryWithConnection<T>(
    connection: PoolConnection,
    tryQuery: QueryStrReturn
  ): Promise<Array<T>> {
    const { queryStr, valueAry } = tryQuery;
    const result = await connection.query(queryStr, valueAry);
    let resultAry: any[] = [];
    if ((result[0] as any as IterableIterator<any>)[Symbol.iterator]) {
      resultAry.push(...(result[0] as Array<T>));
    }
    return resultAry;
  }
}
