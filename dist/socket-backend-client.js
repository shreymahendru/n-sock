"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIoEmitter = require("socket.io-emitter");
const n_config_1 = require("@nivinjoseph/n-config");
const Redis = require("redis");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class SocketBackendClient {
    constructor() {
        this._client = n_config_1.ConfigurationManager.getConfig("env") === "dev"
            ? Redis.createClient() : Redis.createClient(n_config_1.ConfigurationManager.getConfig("REDIS_URL"));
        this._isDisposed = false;
        this._disposePromise = null;
        this._socketClient = SocketIoEmitter(this._client);
    }
    publish(channel, event, data) {
        n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        n_defensive_1.given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        n_defensive_1.given(data, "data").ensureHasValue().ensureIsObject();
        this._socketClient.of(channel).emit(event, data);
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) => this._client.quit(() => resolve()));
        }
        return this._disposePromise;
    }
}
exports.SocketBackendClient = SocketBackendClient;
//# sourceMappingURL=socket-backend-client.js.map