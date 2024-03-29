import { ConfigSchema } from "./db.light.client";
import { MysqlDataType } from "./db.schema";
type AnyFn<T = any> = (...args: any[]) => T;
type Unpacked<T> = T extends (infer U)[] ? U : T;
type Optional<T> = {
    [key in keyof T]?: T[key];
};
type WhereOperator<T> = {
    [key in keyof T as T[key] extends Array<any> | undefined ? never : key]?: ConditionOperator<T[key]>;
};
interface Operator<T> {
    equal?: T;
    not?: T | null;
    lt?: T;
    lte?: T;
    gt?: T;
    gte?: T;
}
type ConditionOperator<T> = T | Operator<T>;
type MergedWhereOperator<T = any> = WhereOperator<T> & {
    OR?: WhereOperator<T>[];
} & {
    AND?: WhereOperator<T>[];
};
type FindUniqueInput<T> = {
    dbSchemaConfig: ConfigSchema;
    where?: MergedWhereOperator<T>;
    select?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? never : key extends "tableName" ? never : key]?: boolean;
    };
    include?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? key : never]?: Omit<FindManyInput<Optional<Unpacked<T[key]>>>, "skip" | "take">;
    } & {
        [key in keyof T as T[key] extends Array<any> | undefined ? never : key]?: FindUniqueInput<Optional<Unpacked<T[key]>>>;
    };
};
type ExceptArrayAndTableName<T, U = boolean> = {
    [key in keyof T as T[key] extends Array<any> | undefined ? never : key extends "tableName" ? never : key]?: U;
};
type AggregateOnlyValue<T, U> = {
    [key in keyof T as T[key] extends U | undefined ? key : never]?: string;
};
type AggregateOperator<T> = {
    count?: ExceptArrayAndTableName<T, string> | string;
    max?: AggregateOnlyValue<T, number>;
    min?: AggregateOnlyValue<T, number>;
    sum?: AggregateOnlyValue<T, number>;
    avg?: AggregateOnlyValue<T, number>;
};
type FindManyInput<T> = {
    dbSchemaConfig: ConfigSchema;
    where?: MergedWhereOperator<T>;
    select?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? never : key extends "tableName" ? never : key]?: boolean;
    };
    aggregate?: AggregateOperator<T>;
    include?: {
        [key in keyof T]?: Omit<FindManyInput<Optional<Unpacked<T[key]>>>, "skip" | "take">;
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
        [key in keyof T as T[key] extends Array<any> | undefined ? key : never]?: Omit<MutationManyInput<Unpacked<T[key]>>, "mutationType">;
    };
    data: Array<{
        [key in keyof T as T[key] extends Array<any> | undefined ? never : key extends "tableName" ? never : key]: T[key];
    }>;
    from?: never;
    select?: never;
};
type MutationSetInput<T, U extends MutationType = any> = {
    mutationType: U;
    dbSchemaConfig: ConfigSchema;
    where?: MergedWhereOperator<T>;
    include?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? key : never]?: Omit<MutationSetInput<Unpacked<T[key]>>, "mutationType">;
    };
    data: [
        {
            [key in keyof T as T[key] extends Array<any> | undefined ? never : MysqlDataType.CheckUndefined<T[key]> extends "NO" ? never : key extends "tableName" ? never : key]: T[key];
        }
    ];
    from?: never;
    select?: never;
};
type MutationDeleteInput<T, U extends MutationType = any> = {
    mutationType: U;
    dbSchemaConfig: ConfigSchema;
    include?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? key : never]?: Omit<MutationDeleteInput<Unpacked<T[key]>>, "mutationType">;
    };
    data: Array<{
        [key in keyof T as T[key] extends Array<any> | undefined ? never : key extends "tableName" ? never : key]: T[key];
    }>;
    where?: never;
    from?: never;
    select?: never;
};
type MutationSetDeleteInput<T, U extends MutationType = any> = {
    mutationType: U;
    dbSchemaConfig: ConfigSchema;
    where?: MergedWhereOperator<T>;
    include?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? key : never]?: Omit<MutationSetDeleteInput<Unpacked<T[key]>>, "mutationType">;
    };
    data?: never;
    from?: never;
    select?: never;
};
type MutationSetInsertInput<T, U extends MutationType = any, I = any> = {
    mutationType: U;
    dbSchemaConfig: ConfigSchema;
    select?: {
        [key in keyof T as T[key] extends Array<any> | undefined ? never : key extends "tableName" ? never : key]?: boolean;
    };
    from: FindManyInput<I>;
    include?: never;
    data?: never;
    where?: never;
};
type MutationType = "INSERT" | "UPDATE" | "UPSERT" | "DELETE" | "SET_UPDATE" | "SET_DELETE" | "SET_INSERT" | "ADD_UPSERT";
type MutationInput<T, U extends MutationType, I = any> = U extends "SET_UPDATE" ? MutationSetInput<T, U> : U extends "DELETE" ? MutationDeleteInput<T, U> : U extends "SET_DELETE" ? MutationSetDeleteInput<T, U> : U extends "SET_INSERT" ? MutationSetInsertInput<T, U, I> : MutationManyInput<T, U>;
export type QueryStrReturn = {
    queryStr: string;
    valueAry?: any[];
};
export default class QueryBuilder {
    static createTable(dbSchemaConfig: ConfigSchema): string;
    static dropTable(dbSchemaConfig: ConfigSchema): string;
    static createForeignKey(dbSchemaConfig: ConfigSchema): Array<string>;
    static dropForeignKey(dbSchemaConfig: ConfigSchema): Array<string>;
    static convertDbValue(value: any): any;
    static where<T>(tableName: string, where: MergedWhereOperator<T>): {
        whereAry: string[];
        whereValueAry: any[];
    };
    static findBuilder<T>(args: FindUniqueInput<T> & FindManyInput<T>, params?: undefined | {
        parentTableName: string | undefined;
        parentForeignKeys: {
            tableName: string;
            fieldName: string;
            parentKey: string;
        }[];
        selectAry: Array<string>;
        whereAry: Array<string>;
        whereValueAry: Array<any>;
        joinAry: Array<string>;
        orderByAry: Array<string>;
        skipTake: Array<string>;
        isAggregate: boolean;
    }): {
        parentTableName: string;
        parentForeignKeys: {
            tableName: string;
            fieldName: string;
            parentKey: string;
        }[];
        selectAry: Array<string>;
        whereAry: Array<string>;
        whereValueAry: Array<any>;
        joinAry: Array<string>;
        orderByAry: Array<string>;
        skipTake: Array<string>;
        isAggregate: boolean;
    };
    static find<T>(args: FindUniqueInput<T> & FindManyInput<T>): QueryStrReturn;
    static mutationBuilder<T, U extends MutationType, I = any>(args: MutationInput<T, U, I>, params?: undefined | {
        mutationType: MutationType;
        dataObj: {
            [key: string]: {
                tableName: string;
                isNeedTransaction: boolean;
                lastFieldAry: string[];
                data: {
                    fieldAry: string[];
                    valueAry: any[];
                    indexObj: {
                        keyAry: string[];
                        valueAry: any[];
                    };
                    exclIndexAry: string[];
                    whereAry: string[];
                    whereValueAry: any[];
                    fromAry?: string[];
                }[];
            };
        };
    }): {
        mutationType: MutationType;
        dataObj: {
            [key: string]: {
                tableName: string;
                isNeedTransaction: boolean;
                lastFieldAry: string[];
                data: {
                    fieldAry: string[];
                    valueAry: any[];
                    indexObj: {
                        keyAry: string[];
                        valueAry: any[];
                    };
                    exclIndexAry: string[];
                    whereAry: string[];
                    whereValueAry: any[];
                    fromAry?: string[];
                }[];
            };
        };
    };
    static mutation<T, U extends MutationType, I = any>(args: MutationInput<T, U, I>, options?: {
        multipleInput: boolean;
    }): Required<QueryStrReturn>[][];
    static insertMutation: <T>(args: MutationManyInput<T, "INSERT">, options?: {
        multipleInput: boolean;
    }) => Required<QueryStrReturn>[][];
    static updateMutation: <T>(args: MutationManyInput<T, "UPDATE">) => Required<QueryStrReturn>[][];
    static upsertMutation: <T>(args: MutationManyInput<T, "UPSERT">, options?: {
        multipleInput: boolean;
    }) => Required<QueryStrReturn>[][];
    static setUpdateMutation: <T>(args: MutationSetInput<T, "SET_UPDATE">) => Required<QueryStrReturn>[][];
    static deleteMutation: <T>(args: MutationDeleteInput<T, "DELETE">) => Required<QueryStrReturn>[][];
    static setDeleteMutation: <T>(args: MutationSetDeleteInput<T, "SET_DELETE">) => Required<QueryStrReturn>[][];
    static setInsertMutation: <T, I>(args: MutationSetInsertInput<T, "SET_INSERT", I>) => Required<QueryStrReturn>[][];
    static addUpsertMutation: <T>(args: MutationManyInput<T, "ADD_UPSERT">, options?: {
        multipleInput: boolean;
    }) => Required<QueryStrReturn>[][];
    static getQueryStrWithItems<T>(queryFn: AnyFn, items: T): Required<QueryStrReturn>[][];
}
export declare class ExportQueryBuilder {
    static find: typeof QueryBuilder.find;
    static mutation: typeof QueryBuilder.mutation;
    static insertMutation: <T>(args: MutationManyInput<T, "INSERT">, options?: {
        multipleInput: boolean;
    } | undefined) => Required<QueryStrReturn>[][];
    static updateMutation: <T>(args: MutationManyInput<T, "UPDATE">) => Required<QueryStrReturn>[][];
    static upsertMutation: <T>(args: MutationManyInput<T, "UPSERT">, options?: {
        multipleInput: boolean;
    } | undefined) => Required<QueryStrReturn>[][];
    static deleteMutation: <T>(args: MutationDeleteInput<T, "DELETE">) => Required<QueryStrReturn>[][];
    static setUpdateMutation: <T>(args: MutationSetInput<T, "SET_UPDATE">) => Required<QueryStrReturn>[][];
    static setDeleteMutation: <T>(args: MutationSetDeleteInput<T, "SET_DELETE">) => Required<QueryStrReturn>[][];
    static setInsertMutation: <T, I>(args: MutationSetInsertInput<T, "SET_INSERT", I>) => Required<QueryStrReturn>[][];
    static addUpsertMutation: <T>(args: MutationManyInput<T, "ADD_UPSERT">, options?: {
        multipleInput: boolean;
    } | undefined) => Required<QueryStrReturn>[][];
    static getQueryStrWithItems: typeof QueryBuilder.getQueryStrWithItems;
}
export {};
