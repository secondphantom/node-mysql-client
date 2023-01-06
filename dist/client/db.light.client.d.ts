import mysql from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { QueryStrReturn } from "./query.builder";
import { MysqlDataType } from "./db.schema";
export type AllDbSchema = MysqlDataType.DbAryObjType<MysqlDataType.DbSchemaObj<any>[]>;
export type ConfigSchema = MysqlDataType.DbSchema;
export default class DbLightClient {
    private pool;
    private promisePool;
    constructor(poolConfig: mysql.PoolOptions);
    tryQuery<T = any>(tryQuery: QueryStrReturn): Promise<Array<T>>;
    tryTrx(trxAry: QueryStrReturn[][]): Promise<[mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader, mysql.FieldPacket[]][][]>;
    beginTrx(): Promise<PoolConnection>;
    commitTrx(connection: PoolConnection): Promise<void>;
    errorTrx(connection: PoolConnection): Promise<void>;
    trxWithConnection(connection: PoolConnection, trxAry: QueryStrReturn[][]): Promise<[mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader, mysql.FieldPacket[]][][]>;
    queryWithConnection<T>(connection: PoolConnection, tryQuery: QueryStrReturn): Promise<Array<T>>;
}
