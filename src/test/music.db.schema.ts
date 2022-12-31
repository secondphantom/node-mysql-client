import DbClient, { QueryBuilder, MysqlDataType, DbLightClient } from "../index";

export type AuthorSchema = {
  tableName?: "authors";
  author_id: number; // PK INT UN
  author: string; // NN
  songs?: SongSchema[];
};

export type SongSchema = {
  tableName?: "songs";
  song_id?: number; // PK INT UN
  author_id: number; // FK INT UN
  genre_id: number; // FK INT UN
  title: string; // NN
};

export type GenreSchema = {
  tableName?: "genres";
  genre_id: number; // PK INT UN
  genre: string; // NN
  songs?: SongSchema[];
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

const songDbSchema: MysqlDataType.DbSchema<
  SongSchema,
  [AuthorSchema, GenreSchema]
> = {
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

const genreDbSchema: MysqlDataType.DbSchema<GenreSchema> = {
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

export default musicDbSchema as MysqlDataType.DbSchemaObj<typeof musicDbSchema>;
