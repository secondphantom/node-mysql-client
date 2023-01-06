import DbClient, { QueryBuilder, MysqlDataType, DbLightClient } from "../index";

import musicDbSchema, {
  AuthorSchema,
  GenreSchema,
  SongSchema,
} from "./music.db.schema";

const schemaFilePath = "./dbSchema.json";
const poolConfig = {
  host: "localhost",
  password: "123456789",
  user: "root",
  database: "music_test",
  connectionLimit: 5,
  timezone: "+00:00",
};
const dbClient = new DbClient(poolConfig, [musicDbSchema], schemaFilePath);

// insert data
const insertData = false;
(async () => {
  if (!insertData) return;
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

  const authorInsertQuery = QueryBuilder.insertMutation<AuthorSchema>({
    dbSchemaConfig: musicDbSchema.authorDbSchema,
    mutationType: "INSERT",
    data: authorList,
  });

  const genreList: GenreSchema[] = [
    {
      genre_id: 1,
      genre: "jazz",
    },
    {
      genre_id: 2,
      genre: "funk",
    },
  ];

  const genreInsertQuery = QueryBuilder.insertMutation<GenreSchema>({
    dbSchemaConfig: musicDbSchema.genreDbSchema,
    mutationType: "INSERT",
    data: genreList,
  });

  const songList: SongSchema[] = [
    {
      title: "bird",
      author_id: 1,
      genre_id: 1,
    },
    {
      title: "horse",
      author_id: 1,
      genre_id: 2,
    },
    {
      title: "elephant",
      author_id: 2,
      genre_id: 2,
    },
  ];

  const songInsertQuery = QueryBuilder.insertMutation<SongSchema>({
    dbSchemaConfig: musicDbSchema.songDbSchema,
    mutationType: "INSERT",
    data: songList,
  });

  const trxQuery = [
    ...authorInsertQuery,
    ...genreInsertQuery,
    ...songInsertQuery,
  ];

  await dbClient.tryTrx(trxQuery);
})();
