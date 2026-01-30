import { addLayout, configure, getLogger } from "log4js";

// addLayout("json", function (config) {
//   return function (logEvent) {
//     return JSON.stringify(logEvent);
//   };
// });

// configure({
//   appenders: {
//     out: { type: "stdout", layout: { type: "json", separator: "," } },
//   },
//   categories: {
//     default: { appenders: ["out"], level: "info" },
//   },
// });

const logger = getLogger();
logger.level = process.env.NODE_ENV === "production" ? "error" : "debug";

if (process.env.NODE_ENV !== "production") {
  logger.debug("Logging initialized at debug level");
}

export const getCustomLogger = (fileName?: string) => {
  return getLogger(fileName ? fileName : undefined);
};

export default logger;
