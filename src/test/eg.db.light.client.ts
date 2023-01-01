import DbClient, { QueryBuilder, MysqlDataType, DbLightClient } from "../index";

import musicDbSchema, {
  AuthorSchema,
  GenreSchema,
  SongSchema,
} from "./music.db.schema";

const poolConfig = {
  host: "localhost",
  password: "123456789",
  user: "root",
  database: "music_test",
  connectionLimit: 5,
  timezone: "+00:00",
};
const dbLightClient = new DbLightClient(poolConfig);

// find data
(async () => {
  const findQuery = QueryBuilder.find<AuthorSchema>({
    dbSchemaConfig: musicDbSchema.authorDbSchema,
    include: {
      songs: {
        dbSchemaConfig: musicDbSchema.songDbSchema,
      },
    },
    where: {
      author: "me",
    },
    take: 2,
  });
  const resultQuery = await dbLightClient.tryQuery(findQuery);
  console.log(resultQuery);

  const findQuery2 = QueryBuilder.find<SongSchema>({
    dbSchemaConfig: musicDbSchema.songDbSchema,
    include: {
      author_id: {
        dbSchemaConfig: musicDbSchema.authorDbSchema,
      },
      genre_id: {
        dbSchemaConfig: musicDbSchema.genreDbSchema,
      },
    },
    take: 2,
  });
  const resultQuery2 = await dbLightClient.tryQuery(findQuery2);
  console.log(resultQuery2);
})();
