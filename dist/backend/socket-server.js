"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const Http = require("http");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const SocketIo = require("socket.io");
const SocketIoRedis = require("socket.io-redis");
const Redis = require("redis");
/**
 * This should only manage socket connections, should not emit (publish) or listen (subscribe)??
 */
class SocketServer {
    constructor(httpServer, corsOrigin, redisUrl) {
        this._isDisposed = false;
        this._disposePromise = null;
        n_defensive_1.given(httpServer, "httpServer").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Http.Server);
        n_defensive_1.given(corsOrigin, "corsOrigin").ensureHasValue().ensureIsString();
        // this._socketServer = new SocketIo.Server(httpServer, {
        //     transports: ["websocket"],
        //     pingInterval: 10000,
        //     pingTimeout: 5000,
        //     serveClient: false
        // });
        this._socketServer = new SocketIo.Server(httpServer, {
            transports: ["websocket"],
            serveClient: false,
            cors: {
                origin: corsOrigin,
                methods: ["GET", "POST"]
            }
        });
        n_defensive_1.given(redisUrl, "redisUrl").ensureIsString();
        this._redisClient = redisUrl && redisUrl.isNotEmptyOrWhiteSpace()
            ? Redis.createClient(redisUrl, {
                tls: {
                    rejectUnauthorized: false
                }
            })
            : Redis.createClient();
        this._socketServer.adapter(SocketIoRedis.createAdapter({
            pubClient: this._redisClient,
            subClient: this._redisClient
        }));
        this.initialize();
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) => this._socketServer.close(() => this._redisClient.quit(() => resolve())));
        }
        return this._disposePromise;
    }
    initialize() {
        this._socketServer.on("connection", (socket) => {
            console.log("Client connected", socket.id);
            socket.on("n-sock-join_channel", (data) => {
                n_defensive_1.given(data, "data").ensureHasValue().ensureIsObject().ensureHasStructure({ channel: "string" });
                console.log(`Client ${socket.id} joining channel ${data.channel}`);
                const nsp = this._socketServer.of(`/${data.channel}`);
                socket.emit(`n-sock-joined_channel/${data.channel}`, { channel: nsp.name.substr(1) });
                console.log(`Client ${socket.id} joined channel ${nsp.name.substr(1)}`);
            });
        });
    }
}
exports.SocketServer = SocketServer;
//# sourceMappingURL=socket-server.js.map