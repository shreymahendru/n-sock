"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const SocketIoEmitter = require("socket.io-emitter");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_exception_1 = require("@nivinjoseph/n-exception");
/**
 * This should only emit (publish) events
 */
class SocketService {
    constructor(redisClient) {
        this._isDisposed = false;
        this._disposePromise = null;
        n_defensive_1.given(redisClient, "redisClient").ensureHasValue().ensureIsObject();
        this._redisClient = redisClient;
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
            this._disposePromise = Promise.resolve();
        }
        return this._disposePromise;
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socket-service.js.map