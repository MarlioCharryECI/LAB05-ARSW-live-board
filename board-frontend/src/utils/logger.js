// utils/logger.js
export class Logger {
  static levels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  };

  static currentLevel = this.levels.INFO;

  static setLevel(level) {
    this.currentLevel = level;
  }

  static formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return data ? `${prefix} ${message} - Data: ${JSON.stringify(data)}` : `${prefix} ${message}`;
  }

  static error(message, data = null) {
    if (this.currentLevel >= this.levels.ERROR) {
      console.error(this.formatMessage("ERROR", message, data));
    }
  }

  static warn(message, data = null) {
    if (this.currentLevel >= this.levels.WARN) {
      console.warn(this.formatMessage("WARN", message, data));
    }
  }

  static info(message, data = null) {
    if (this.currentLevel >= this.levels.INFO) {
      console.info(this.formatMessage("INFO", message, data));
    }
  }

  static debug(message, data = null) {
    if (this.currentLevel >= this.levels.DEBUG) {
      console.debug(this.formatMessage("DEBUG", message, data));
    }
  }
}
