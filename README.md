# Mysql Client
This library created under the influence of the `prisma` library. This library uses the `mysql2` library.
# Table of contents
- [Mysql Client](#mysql-client)
- [Table of contents](#table-of-contents)
- [Schema](#schema)
	- [Examples](#examples)
	- [DbSchema Fields](#dbschema-fields)
		- [type](#type)
		- [size](#size)
		- [notNull](#notnull)
		- [unique / indexKey](#unique--indexkey)
		- [primaryKey](#primarykey)
		- [foreignKey](#foreignkey)
		- [comment](#comment)
		- [isBoolean](#isboolean)
		- [defaultValue](#defaultvalue)
		- [unsigned / autoIncrement](#unsigned--autoincrement)
- [Client](#client)
	- [Create Basic](#create-basic)
	- [Create Light](#create-light)
	- [Methods](#methods)
		- [tryQuery](#tryquery)
		- [tryTrx](#trytrx)
		- [Custom Transaction](#custom-transaction)
- [QueryBuilder](#querybuilder)
	- [Find](#find)
		- [Fields](#fields)
		- [Example](#example)
	- [Mutation](#mutation)
		- [INSERT/UPDATE/UPSERT/ADD\_UPSERT](#insertupdateupsertadd_upsert)
			- [Fields](#fields-1)
			- [Example](#example-1)
		- [SET\_UPDATE](#set_update)
			- [Fields](#fields-2)
			- [Example](#example-2)
		- [DELETE](#delete)
			- [Fields](#fields-3)
			- [Example](#example-3)
		- [SET\_DELETE](#set_delete)
			- [Fields](#fields-4)
			- [Example](#example-4)
		- [SET\_INSERT](#set_insert)
			- [Fields](#fields-5)
			- [Example](#example-5)
	- [Other](#other)
		- [where](#where)
			- [Fields](#fields-6)
			- [operator Fields](#operator-fields)
			- [Example](#example-6)
		- [Aggregate](#aggregate)
			- [Fields](#fields-7)
			- [Input](#input)

# Schema
## Examples
```ts
type AuthorSchema = {
  tableName?: "authors";
  author_id: number; // PK INT UN
  author: string; // NN
};
const authorDbSchema: MysqlDataType.DbSchema<AuthorSchema> = {
  tableName: "authors",
  fields: {
    author_id: {
      type: "INT",
      unsigned: true,
      primaryKey: true,
    },
    author: {
      type: "VARCHAR",
      size: 500,
      notNull: true,
      indexKey: true,
    },
  },
};
```
## DbSchema Fields
### type
- `Required`
- `T` is typeScript type
```ts
DbFieldValues<T> = {
	type:T extends number | undefined
      ? Number
      : T extends string | undefined
      ? String
      : T extends Date | undefined
      ? DbDate
      : T extends boolean | null | undefined
      ? DbBoolean
      : T extends Json | undefined
      ? DbJson
      : DbJson;
}
type DbBoolean = "TINYINT";
type Number =
    | "TINYINT"
    | "SMALLINT"
    | "MEDIUMINT"
    | "INT"
    | "BIGINT"
    | "DECIMAL"
    | "FLOAT"
    | "DOUBLE";
type String =
    | "CHAR"
    | "VARCHAR"
    | "TINYTEXT"
    | "TEXT"
    | "MEDIUMTEXT"
    | "LONGTEXT";
type DbDate = "DATE" | "TIME" | "DATETIME" | "TIMESTAMP" | "YEAR";
type DbJson = "JSON";
```
### size
- `Optional`
```ts
DbFieldValues = {
	size?: number;
}
```
### notNull
- `Optional`
- Default value is `false`
```ts
DbFieldValues = {
	notNull?: true;
}
```
### unique / indexKey
- `Optional`
- Two column key
  - `PT` is pair key
  - `CK` is current key
  - Can set order by `order` field
```ts
DbFieldValues = {
	unique?:
      | true
      | {
          with: { 0: keyof PT } & Array<keyof PT>;
          order: number;
          key: CK;
        };
}
```
### primaryKey
- `Optional`
- Default value is `false`
```ts
DbFieldValues = {
	primaryKey?: true;
}
```
### foreignKey
- `Optional`
- `M` is foreign key table types
```ts
DbFieldValues<M> = {
	foreignKey?: {
      tableName: PickTypeValues<GetUnionElementType<M>, "tableName">;
      fieldName: keyof UnionToIntersection<GetUnionElementType<M>>;
      symbol?: string;
      enforced?: Enforced;
    };
}
type Enforced =
    | "CASCADE"
    | "SET NULL"
    | "NO ACTION"
    | "SET DEFAULT"
    | "RESTRICT";
```
### comment
- `Optional`
```ts
DbFieldValues = {
	comment?: string;
}
```
### isBoolean
- `Optional`
- This field not affect the db schema.
- When querying boolean field data from mysql DB, the DB returns 0 or 1. Because mysql DB `boolean` type is stored as `tiny int`.
- You can set this field to use as a distinction between other 0 and 1.
```ts
DbFieldValues = {
	isBoolean?: T extends boolean | null | undefined ? true | never : never;
}
```
### defaultValue
- `Optional`
- `T` is typeScript type
```ts
DbFieldValues<T> = {
	defaultValue: T extends Date | undefined
          ? DateTimeDefaultValue
          : string;
}
type DateTimeDefaultValue =
    | "CURRENT_TIMESTAMP"
    | "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP";
```
### unsigned / autoIncrement
- `Optional`
- `T` is typeScript type
```ts
DbFieldValues = {
	unsigned?: true;
	autoIncrement?: true;
}
```
# Client
## Create Basic
- The basic DbClient has a migration tool that uses the schema json file.
- When you make change to the Db Schema,the DbClient automatically identifies changes by table and creates new one.  
```ts
import musicDbSchema, {
  AuthorSchema,
  GenreSchema,
  SongSchema,
} from "./music.db.schema";
const schemaFilePath = "./dbSchema.json";
// poolConfig is mysql2 pool config
const poolConfig = {
  host: "localhost",
  password: "123456789",
  user: "root",
  database: "music_test",
  connectionLimit: 5,
  timezone: "+00:00",
};
const dbClient = new DbClient(poolConfig, [musicDbSchema], schemaFilePath);
```
## Create Light
- The migration tool in the basic DbClient has the problem of losing existing data in the DB.
- Light DbClient does not have a migration tool.
```ts
const poolConfig = {
  host: "localhost",
  password: "123456789",
  user: "root",
  database: "music_test",
  connectionLimit: 5,
  timezone: "+00:00",
};
const dbLightClient = new DbLightClient(poolConfig);
```
## Methods
[QueryBuilder](#QueryBuilder) makes it easy to obtain query strings.
- tryQuery
- tryTrx
- custom trx
  - beginTrx
  - commitTrx
  - errorTrx
  - trxWithConnection
### tryQuery
- `T` is table schema
- Return Promise<Array\<`T`>>
```ts
type QueryStrReturn = { queryStr: string; valueAry?: any[] };
const query:QueryStrReturn = {query: "select * from test"}
const result = await dbClient.tryQuery<T>.tryQuery(query)
```
### tryTrx
- This method automatically creates and executes transactions concurrently by `Promise.all`. Perform a rollback if the transaction fails.
```ts
type QueryStrReturn = { queryStr: string; valueAry?: any[] };
const result = await dbClient.tryQuery.tryTrx(query as QueryStrReturn[][])
```
### Custom Transaction
- You can run queries with custom transaction
```ts
// get transaction connection
const connection:PoolConnection = await dbClient.beginTrx();
// query
try {
	await dbClient.trxWithConnection(connection,trxAry as QueryStrReturn[][]);
	await dbClient.queryWithConnection(connection,trxQuery as QueryStrReturn);
	// commit
	await commitTrx(connection);
} catch (e) {
	console.log(e);
	// rollback
	await errorTrx(connection);
}
```
# QueryBuilder
## Find
### Fields
- include field makes `join query` through `foreign key`

| Field          | Optional | Input                           |
| -------------- | :------: | ------------------------------- |
| dbSchemaConfig |  false   | [DbSchema](#schema)             |
| where          |   true   | [Where Builder](#where)         |
| include        |   true   | [Find Builder](#find)           |
| aggregate      |   true   | [Aggregate Builder](#aggregate) |
| select         |   true   | keyof schema : boolean          |
| orderBy        |   true   | `DESC` or `ASC`                 |
| skip           |   true   | number                          |
| take           |   true   | number                          |
### Example
```ts
const query = QueryBuilder.find<AuthorSchema>({
	dbSchemaConfig: musicDbSchema.authorDbSchema,
	...{	aggregate: {
		count: {
			author_id: "total",
		},
	}}
	include: {
		songs: {
			dbSchemaConfig: musicDbSchema.songDbSchema,
		},
	},
	select {
		author: true,
		....
	},
	where: {
		author: "me"
	},
	take: 2,
	skip: 1,
	
});
```
## Mutation
### INSERT/UPDATE/UPSERT/ADD_UPSERT
Mutation array of data
#### Fields
| Field          | Optional | Input                                         |
| -------------- | :------: | --------------------------------------------- |
| dbSchemaConfig |  false   | [DbSchema](#schema)                           |
| mutationType   |  false   | `INSERT`,`UPDATE`, `UPSERT` or `ADD_UPSERT`   |
| data           |  false   | Array of Data                                 |
| include        |   true   | [THIS BUILDER](#insertupdateupsertadd_upsert) |

#### Example
```ts
const authorList: AuthorSchema[] = [
	{
		author_id: 1,
		author: "me",
	},
	{
		author_id: 2,
		author: "you",
	},
];
const query = QueryBuilder.insertMutation<AuthorSchema>({
	dbSchemaConfig: musicDbSchema.authorDbSchema,
	mutationType: "INSERT",
	data: authorList,
});
```

### SET_UPDATE  
Update all values of in the `where` condition.  
#### Fields
| Field          | Optional | Input                       |
| -------------- | :------: | --------------------------- |
| dbSchemaConfig |  false   | [DbSchema](#schema)         |
| mutationType   |  false   | `SET_UPDATE`                |
| data           |  false   | Array of Data               |
| include        |   true   | [THIS BUILDER](#set_update) |
| where          |   true   | [Where Builder](#where)     |
#### Example
```ts
const authorList: AuthorSchema[] = [
	{
		author: "you",
	},
];
const query = QueryBuilder.setUpdateMutation<AuthorSchema>({
	dbSchemaConfig: musicDbSchema.authorDbSchema,
	mutationType: "SET_UPDATE",
	data: authorList,
	where: {
		author: "me"
	}
});
```
### DELETE
Deletes a value matching array of data.
#### Fields
| Field          | Optional | Input                   |
| -------------- | :------: | ----------------------- |
| dbSchemaConfig |  false   | [DbSchema](#schema)     |
| mutationType   |  false   | `DELETE`                |
| data           |  false   | Array of Data           |
| include        |   true   | [THIS BUILDER](#delete) |
#### Example
```ts
const authorList: AuthorSchema[] = [
	{
		author: "me",
	},
];
const query = QueryBuilder.deleteMutation<AuthorSchema>({
	dbSchemaConfig: musicDbSchema.authorDbSchema,
	mutationType: "DELETE",
	data: authorList,
});
```
### SET_DELETE
Delete all values of in the `where` condition
#### Fields
| Field          | Optional | Input                       |
| -------------- | :------: | --------------------------- |
| dbSchemaConfig |  false   | [DbSchema](#schema)         |
| mutationType   |  false   | `SET_DELETE`                |
| include        |   true   | [THIS BUILDER](#set_delete) |
| where          |   true   | [Where Builder](#where)     |
#### Example
```ts
const query = QueryBuilder.deleteMutation<AuthorSchema>({
	dbSchemaConfig: musicDbSchema.authorDbSchema,
	mutationType: "SET_DELETE",
	where: {
		author: 'me'
	}
});
```
### SET_INSERT
Insert current table values found in `from` fields [Find Builder](#find)
#### Fields
| Field          | Optional | Input                  |
| -------------- | :------: | ---------------------- |
| dbSchemaConfig |  false   | [DbSchema](#schema)    |
| mutationType   |  false   | `SET_INSERT`           |
| from           |  false   | [Find Builder](#find)  |
| select         |  false   | keyof schema : boolean |
#### Example
```ts
const query = QueryBuilder.deleteMutation<AuthorHistorySchema,AuthorSchema>({
	dbSchemaConfig: musicDbSchema.authorHistoryDbSchema,
	mutationType: "SET_DELETE",
	form: {
		dbSchemaConfig: musicDbSchema.authorDbSchema,
		select: {
			author: true,
		}
	}
	select: {
		author: true,
	}
});
```
## Other
### where 
#### Fields
|    Field     | Input                                                              |
| :----------: | ------------------------------------------------------------------ |
|   OR / AND   | array of  {keyof schema : boolean / [Operator Builder](#operator-fields)} |
| keyof schema | boolean / [Operator Builder](#operator-fields)                            |
#### operator Fields
| Field |    Input     | description        |
| :---: | :----------: | ------------------ |
| equal |    value     | euqal              |
|  not  | value / null | not                |
|  lt   |    value     | lower than         |
|  lte  |    value     | lower than equal   |
|  gt   |    value     | greater than       |
|  gte  |    value     | greater than equal |
#### Example
```ts
const query = QueryBuilder.find<SongSchema>({
	dbSchemaConfig: musicDbSchema.songDbSchema,
	where: {
		title: "test",
		author: {
			equal: "me"
		},
		length: {
			gt: 180,
		}
	},
});
const query2 = QueryBuilder.find<SongSchema>({
	dbSchemaConfig: musicDbSchema.songDbSchema,
	where: {
		OR: [
			{
				author: {
					equal: "me"
				}
			},
			{
				author: {
					not: "you"
				}
			}
		]
	},
});
```
### Aggregate
#### Fields
| Field |          Input           | description                                                     |
| :---: | :----------------------: | --------------------------------------------------------------- |
| count | [Input](#input) / string | count row if value string count all row and value is colum name |
|  max  |     [Input](#input)      | max value                                                       |
|  min  |     [Input](#input)      | min value                                                       |
|  sum  |     [Input](#input)      | sum value                                                       |
|  avg  |     [Input](#input)      | avg value                                                       |
#### Input
|    Field     | Value  | description |
| :----------: | :----: | ----------- |
| keyof schema | string | column name |