"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const Http = require("http");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const SocketIo = require("socket.io");
const SocketIoRedis = require("@socket.io/redis-adapter");
/**
 * This should only manage socket connections, should not emit (publish) or listen (subscribe)??
 */
class SocketServer {
    constructor(httpServer, corsOrigin, redisClient) {
        this._isDisposed = false;
        this._disposePromise = null;
        (0, n_defensive_1.given)(httpServer, "httpServer").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Http.Server);
        (0, n_defensive_1.given)(corsOrigin, "corsOrigin").ensureHasValue().ensureIsString();
        (0, n_defensive_1.given)(redisClient, "redisClient").ensureHasValue().ensureIsObject();
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
        this._redisClient = redisClient;
        // this._socketServer.adapter(SocketIoRedis.createAdapter({
        //     pubClient: this._redisClient,
        //     subClient: this._redisClient
        // }));
        this._socketServer.adapter(SocketIoRedis.createAdapter(this._redisClient, this._redisClient));
        this.initialize();
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._disposePromise = Promise.resolve();
        }
        return this._disposePromise;
    }
    initialize() {
        this._socketServer.on("connection", (socket) => {
            console.log("Client connected", socket.id);
            socket.on("n-sock-join_channel", (data) => {
                (0, n_defensive_1.given)(data, "data").ensureHasValue().ensureIsObject().ensureHasStructure({ channel: "string" });
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