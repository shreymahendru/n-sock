"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const SocketIoEmitter = require("socket.io-emitter");
const Redis = require("redis");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
class SocketService {
    constructor(redisUrl) {
        this._isDisposed = false;
        this._disposePromise = null;
        n_defensive_1.given(redisUrl, "redisUrl").ensureIsString();
        this._redisClient = redisUrl && redisUrl.isNotEmptyOrWhiteSpace()
            ? Redis.createClient(redisUrl, {
                tls: {
                    rejectUnauthorized: false
                }
            })
            : Redis.createClient();
        this._socketClient = SocketIoEmitter(this._redisClient);
    }
    publish(channel, event, data) {
        n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        n_defensive_1.given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        n_defensive_1.given(data, "data").ensureHasValue().ensureIsObject();
        if (this._isDisposed)
            throw new n_exception_1.ObjectDisposedException(this);
        this._socketClient.of(`/${channel}`).emit(event, data);
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) => this._redisClient.quit(() => resolve()));
        }
        return this._disposePromise;
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socket-service.js.map