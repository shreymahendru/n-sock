"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIOClient = require("socket.io-client");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
class SocketClient {
    constructor(serverUrl) {
        this._channels = new Map();
        this._mutex = new n_util_1.Mutex();
        this._isDisposed = false;
        n_defensive_1.given(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        serverUrl = serverUrl.trim();
        if (serverUrl.endsWith("/"))
            serverUrl = serverUrl.substr(0, serverUrl.length - 1);
        this._serverUrl = serverUrl;
        this._client = SocketIOClient.connect(this._serverUrl, {
            transports: ["websocket"],
        });
    }
    subscribe(channel, event, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
            channel = channel.trim();
            n_defensive_1.given(event, "event").ensureHasValue().ensureIsString();
            event = event.trim();
            n_defensive_1.given(handler, "handler").ensureHasValue().ensureIsFunction();
            yield this._mutex.lock();
            try {
                if (!this._channels.has(channel)) {
                    const socket = yield this.createChannel(channel);
                    this._channels.set(channel, socket);
                }
                const socket = this._channels.get(channel);
                socket.on(event, handler);
            }
            finally {
                this._mutex.release();
            }
        });
    }
    unsubscribe(channel, event, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
            channel = channel.trim();
            yield this._mutex.lock();
            try {
                if (!this._channels.has(channel))
                    return;
                const socket = this._channels.get(channel);
                if (!event) {
                    socket.close();
                    this._channels.delete(channel);
                    return;
                }
                n_defensive_1.given(event, "event").ensureHasValue().ensureIsString();
                event = event.trim();
                n_defensive_1.given(handler, "handler").ensureIsFunction();
                socket.off(event, handler || null);
            }
            finally {
                this._mutex.release();
            }
        });
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            for (const value of this._channels.values())
                value.close();
            this._client.close();
        }
        return Promise.resolve();
    }
    createChannel(channel) {
        return new Promise((resolve, reject) => {
            try {
                n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
                channel = channel.trim();
                this._client.once(`n-sock-joined_channel/${channel}`, (data) => {
                    if (data.channel === channel) {
                        const socket = SocketIOClient.connect(`${this._serverUrl}/${channel}`, {
                            transports: ["websocket"],
                            upgrade: false
                        });
                        resolve(socket);
                    }
                    else
                        reject(new Error(`Joined channel mismatch; expected '${channel}', actual '${data.channel}'`));
                });
                this._client.emit("n-sock-join_channel", { channel });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.SocketClient = SocketClient;
//# sourceMappingURL=socket-client.js.map