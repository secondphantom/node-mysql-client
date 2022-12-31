import { MysqlDataType } from "../index";
export type AuthorSchema = {
    tableName?: "authors";
    author_id: number;
    author: string;
    songs?: SongSchema[];
};
export type SongSchema = {
    tableName?: "songs";
    song_id?: number;
    author_id: number;
    genre_id: number;
    title: string;
};
export type GenreSchema = {
    tableName?: "genres";
    genre_id: number;
    genre: string;
    songs?: SongSchema[];
};
declare const _default: MysqlDataType.DbSchemaObj<{
    authorDbSchema: MysqlDataType.DbSchema<AuthorSchema, []>;
    songDbSchema: MysqlDataType.DbSchema<SongSchema, [AuthorSchema, GenreSchema]>;
    genreDbSchema: MysqlDataType.DbSchema<GenreSchema, []>;
}>;
export default _default;
