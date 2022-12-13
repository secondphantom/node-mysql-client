import { createLogger, format, transports } from "winston";

const timezone = () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
  });
};

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: timezone,
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({
          message: true,
        }),
        format.simple()
      ),
    }),
  ],
});

// if (config.env !== "dev") {
//   logger.add(
//     new transports.File({
//       filename: path.join(__dirname, "../log", "error.log"),
//       level: "error",
//     })
//   );
//   logger.add(
//     new transports.File({
//       filename: path.join(__dirname, "../log", "combined.log"),
//     })
//   );
// }

export default logger;
