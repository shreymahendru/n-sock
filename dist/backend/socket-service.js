"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIoEmitter = require("socket.io-emitter");
const Redis = require("redis");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_ject_1 = require("@nivinjoseph/n-ject");
const n_exception_1 = require("@nivinjoseph/n-exception");
let SocketService = class SocketService {
    constructor(redisClient) {
        this._isDisposed = false;
        this._disposePromise = null;
        n_defensive_1.given(redisClient, "redisClient").ensureHasValue().ensureIsObject();
        this._socketClient = SocketIoEmitter(redisClient);
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
};
SocketService = __decorate([
    n_ject_1.inject("RedisClient"),
    __metadata("design:paramtypes", [Redis.RedisClient])
], SocketService);
exports.SocketService = SocketService;
//# sourceMappingURL=socket-service.js.map