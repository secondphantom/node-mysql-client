export type Json = string | number | boolean | {
    [key: string]: Json;
} | Json[] | null;
export declare namespace MysqlDataType {
    export type CheckAllowNullUndefined<T> = null extends Extract<T, null | undefined> ? "YES" : undefined extends Extract<T, null | undefined> ? "YES" : "NO";
    export type CheckAllowNull<T> = null extends Extract<T, null | undefined> ? "YES" : "NO";
    export type CheckUndefined<T> = undefined extends Extract<T, null | undefined> ? "YES" : "NO";
    export type DbBoolean = "TINYINT";
    export type Number = "TINYINT" | "SMALLINT" | "MEDIUMINT" | "INT" | "BIGINT" | "DECIMAL" | "FLOAT" | "DOUBLE";
    export type String = "CHAR" | "VARCHAR" | "TINYTEXT" | "TEXT" | "MEDIUMTEXT" | "LONGTEXT";
    export type DbDate = "DATE" | "TIME" | "DATETIME" | "TIMESTAMP" | "YEAR";
    export type DbJson = "JSON";
    export type All = Number | String | DbDate | DbJson;
    export type DateTimeDefaultValue = "CURRENT_TIMESTAMP" | "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
    export type Enforced = "CASCADE" | "SET NULL" | "NO ACTION" | "SET DEFAULT" | "RESTRICT";
    export type PickTypeValues<T, U> = T extends {
        [key in keyof T as key extends U ? key : never]: infer R;
    } ? R : never;
    export type GetUnionElementType<T> = T extends (infer U)[] ? U : never;
    export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
    export type TypeKeys<T> = keyof T;
    export type DbFieldValues<T = any, M = any, PT = any, CK = any> = {
        type: T extends number | undefined ? Number : T extends string | undefined ? String : T extends Date | undefined ? DbDate : T extends boolean | null | undefined ? DbBoolean : T extends Json | undefined ? DbJson : DbJson;
        size?: number;
        notNull?: true;
        unique?: true | {
            with: {
                0: keyof PT;
            } & Array<keyof PT>;
            order: number;
            key: CK;
        };
        primaryKey?: true;
        indexKey?: true | {
            with: {
                0: keyof PT;
            } & Array<keyof PT>;
            order: number;
            key: CK;
        };
        foreignKey?: {
            tableName: PickTypeValues<GetUnionElementType<M>, "tableName">;
            fieldName: keyof UnionToIntersection<GetUnionElementType<M>>;
            symbol?: string;
            enforced?: Enforced;
        };
        comment?: string;
        isBoolean?: T extends boolean | null | undefined ? true | never : never;
    } & (CheckAllowNullUndefined<T> extends "YES" ? {
        defaultValue: T extends Date | undefined ? DateTimeDefaultValue : string;
    } : {
        defaultValue?: string;
    }) & (T extends number | null | undefined ? {
        unsigned?: true;
        autoIncrement?: true;
    } : {
        unsigned?: never;
        autoIncrement?: never;
    });
    export type DbFields<T = any, M = any> = {
        [key in keyof T as CheckAllowNull<T[key]> extends "YES" ? key : never]?: DbFieldValues<T[key], M, Omit<T, key>, key>;
    } & {
        [key in keyof T as CheckAllowNull<T[key]> extends "YES" ? never : key]: DbFieldValues<T[key], M, Omit<T, key>, key>;
    } & (T extends any ? {
        [key in keyof T]: DbFieldValues<T[key], M, Omit<T, key>, key>;
    } : {});
    export type DbSchema<T = {
        tableName: string;
    } & {
        [key: string]: any;
    }, M extends any[] = []> = {
        [key in keyof T as key extends "tableName" ? key : never]-?: T[key];
    } & {
        fields: DbFields<Omit<T, "tableName">, M>;
    };
    export type TypeValues<T> = T[keyof T];
    export type DbAryObjType<T extends any[]> = {
        [key: string]: DbAryConfig<T>;
    };
    export type DbSchemaObj<T> = {
        [key in keyof T]: DbSchema;
    };
    type DbAryConfigTableName<T extends any[]> = PickTypeValues<TypeValues<GetUnionElementType<T>>, "tableName">;
    type DbAryConfigFields<T extends any[]> = PickTypeValues<TypeValues<GetUnionElementType<T>>, "fields">;
    export type DbAryConfig<T extends any[]> = {
        tableName: DbAryConfigTableName<T>;
        fields: DbAryConfigFields<T>;
    };
    export type ObjInferValues<T> = T extends {
        [key in keyof T]: infer R;
    } ? R : never;
    export {};
}
