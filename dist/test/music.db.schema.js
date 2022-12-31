"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authorDbSchema = {
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
const songDbSchema = {
    tableName: "songs",
    fields: {
        song_id: {
            type: "INT",
            defaultValue: "0",
            autoIncrement: true,
            unsigned: true,
            primaryKey: true,
        },
        author_id: {
            type: "INT",
            defaultValue: "0",
            unsigned: true,
            foreignKey: {
                tableName: "authors",
                fieldName: "author_id",
            },
        },
        genre_id: {
            type: "INT",
            defaultValue: "0",
            unsigned: true,
            foreignKey: {
                tableName: "genres",
                fieldName: "genre_id",
            },
        },
        title: {
            type: "VARCHAR",
            size: 500,
            notNull: true,
        },
    },
};
const genreDbSchema = {
    tableName: "genres",
    fields: {
        genre_id: {
            type: "INT",
            unsigned: true,
            primaryKey: true,
        },
        genre: {
            type: "VARCHAR",
            size: 500,
            notNull: true,
            indexKey: true,
        },
    },
};
const musicDbSchema = {
    authorDbSchema,
    songDbSchema,
    genreDbSchema,
};
exports.default = musicDbSchema;
