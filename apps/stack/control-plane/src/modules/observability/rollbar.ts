import { env } from "../../utilities/env";

import TransportStream, { TransportStreamOptions } from "winston-transport";
import Rollbar from "rollbar";

export const rollbar = new Rollbar({
  accessToken: env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    code_version: env.VERSION,
  },
  enabled: !!env.ROLLBAR_ACCESS_TOKEN,
});

export class RollbarTransport extends TransportStream {
  constructor(
    opts: TransportStreamOptions,
    private rollbar: Rollbar,
  ) {
    super(opts);
    this.level = opts.level || "warn";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(info: any, callback: () => void): void {
    const level = info[Symbol.for("level")];
    const message = info.message;
    const meta = Object.assign({}, info);
    delete meta.level;
    delete meta.message;
    delete meta.splat;
    delete meta[Symbol.for("level")];

    if (level === "error") {
      this.rollbar.error(message, meta, callback);
    } else if (level === "warn") {
      this.rollbar.warning(message, meta, callback);
    } else if (level === "info") {
      this.rollbar.info(message, meta, callback);
    } else if (level === "debug") {
      this.rollbar.debug(message, meta, callback);
    } else {
      this.rollbar.info(message, meta, callback);
    }
  }
}
