"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Http = require("http");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const SocketIo = require("socket.io");
const SocketIoRedis = require("socket.io-redis");
const n_config_1 = require("@nivinjoseph/n-config");
const Redis = require("redis");
class SocketServer {
    constructor(httpServer) {
        n_defensive_1.given(httpServer, "httpServer").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Http.Server);
        this._socketServer = SocketIo(httpServer);
        this._client = n_config_1.ConfigurationManager.getConfig("env") === "dev"
            ? Redis.createClient() : Redis.createClient(n_config_1.ConfigurationManager.getConfig("REDIS_URL"));
        this._isDisposed = false;
        this._disposePromise = null;
        this._socketServer.adapter(SocketIoRedis(this._client));
        this._socketServer.on("connection", (socket) => {
            console.log("Client connected", socket.id);
        });
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) => this._client.quit(() => resolve()));
        }
        return this._disposePromise;
    }
}
exports.SocketServer = SocketServer;
//# sourceMappingURL=socket-server.js.map