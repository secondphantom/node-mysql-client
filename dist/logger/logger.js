"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const timezone = () => {
    return new Date().toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
    });
};
const logger = (0, winston_1.createLogger)({
    level: "info",
    format: winston_1.format.combine(winston_1.format.timestamp({
        format: timezone,
    }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json()),
    defaultMeta: { service: "user-service" },
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize({
                message: true,
            }), winston_1.format.simple()),
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
exports.default = logger;
