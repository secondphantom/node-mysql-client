"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const music_db_schema_1 = __importDefault(require("./music.db.schema"));
const poolConfig = {
    host: "localhost",
    password: "123456789",
    user: "root",
    database: "music_test",
    connectionLimit: 5,
    timezone: "+00:00",
};
const dbLightClient = new index_1.DbLightClient(poolConfig);
// find data
(async () => {
    const findQuery = index_1.QueryBuilder.find({
        dbSchemaConfig: music_db_schema_1.default.authorDbSchema,
        include: {
            songs: {
                dbSchemaConfig: music_db_schema_1.default.songDbSchema,
            },
        },
        where: {
            author: "me",
        },
        take: 2,
    });
    const resultQuery = await dbLightClient.tryQuery(findQuery);
    console.log(resultQuery);
    const findQuery2 = index_1.QueryBuilder.find({
        dbSchemaConfig: music_db_schema_1.default.songDbSchema,
        include: {
            author_id: {
                dbSchemaConfig: music_db_schema_1.default.authorDbSchema,
            },
            genre_id: {
                dbSchemaConfig: music_db_schema_1.default.genreDbSchema,
            },
        },
        take: 2,
    });
    const resultQuery2 = await dbLightClient.tryQuery(findQuery2);
    console.log(resultQuery2);
    const aggregateQuery = index_1.QueryBuilder.find({
        dbSchemaConfig: music_db_schema_1.default.songDbSchema,
        include: {
            author_id: {
                dbSchemaConfig: music_db_schema_1.default.authorDbSchema,
            },
            genre_id: {
                dbSchemaConfig: music_db_schema_1.default.genreDbSchema,
            },
        },
        aggregate: {
            count: {
                author_id: "total",
            },
            max: {
                song_id: "max",
            },
            sum: {
                song_id: "sum",
            },
            avg: {
                song_id: "avg",
            },
            min: {
                song_id: "min",
            },
        },
    });
    const aggregateResult = await dbLightClient.tryQuery(aggregateQuery);
    console.log(aggregateResult);
    // [ { total: 4, max: 4, sum: '10', avg: '2.5000', min: 1 } ]
    // end pool
    try {
        dbLightClient.endPool();
        await dbLightClient.tryQuery(findQuery2);
    }
    catch (error) {
        console.error(error);
    }
})();
