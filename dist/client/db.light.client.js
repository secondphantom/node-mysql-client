"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const logger_1 = __importDefault(require("../logger/logger"));
class DbLightClient {
    pool;
    promisePool;
    constructor(poolConfig) {
        this.pool = mysql2_1.default.createPool(poolConfig);
        this.promisePool = this.pool.promise();
    }
    tryQuery = async (tryQuery) => {
        let error = undefined;
        let resultAry = [];
        const { queryStr, valueAry } = tryQuery;
        try {
            const connection = await this.promisePool.getConnection();
            try {
                const result = await connection.query(queryStr, valueAry);
                connection.release();
                if (result[0][Symbol.iterator]) {
                    resultAry.push(...result[0]);
                }
            }
            catch (e) {
                logger_1.default.info(queryStr);
                e.sqlMessage ? logger_1.default.error(e.sqlMessage) : logger_1.default.error(e);
                error = e;
                connection.release();
            }
        }
        catch (e) {
            error = e;
            e.sqlMessage ? logger_1.default.error(e.sqlMessage) : logger_1.default.error(e);
        }
        if (error)
            throw new Error(error);
        return resultAry;
    };
    tryTrx = async (trxAry) => {
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
            }
            catch (e) {
                await connection.rollback();
                error = e;
                e.sqlMessage ? logger_1.default.error(e.sqlMessage) : logger_1.default.error(e);
            }
            finally {
                connection.release();
            }
        }
        catch (e) {
            error = e;
            e.sqlMessage ? logger_1.default.error(e.sqlMessage) : logger_1.default.error(e);
        }
        if (error)
            throw new Error(error);
        return resultAry;
    };
    beginTrx = async () => {
        const connection = await this.promisePool.getConnection();
        await connection.beginTransaction();
        return connection;
    };
    commitTrx = async (connection) => {
        await connection.commit();
        connection.release();
    };
    errorTrx = async (connection) => {
        await connection.rollback();
        connection.release();
    };
    trxWithConnection = async (connection, trxAry) => {
        let resultAry = [];
        for await (const trx of trxAry) {
            const promiseAry = trx.map((trxInfo) => {
                return connection.query(trxInfo.queryStr, trxInfo.valueAry);
            });
            const result = await Promise.all(promiseAry);
            resultAry.push(result);
        }
        return resultAry;
    };
    queryWithConnection = async (connection, tryQuery) => {
        const { queryStr, valueAry } = tryQuery;
        const result = await connection.query(queryStr, valueAry);
        let resultAry = [];
        if (result[0][Symbol.iterator]) {
            resultAry.push(...result[0]);
        }
        return resultAry;
    };
    endPool = () => {
        this.pool.end();
    };
}
exports.default = DbLightClient;
