"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SocketIOClient = require("socket.io-client");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class SocketFrontEndClient {
    constructor(serverUrl) {
        n_defensive_1.given(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        serverUrl = serverUrl.trim();
        if (serverUrl.endsWith("/"))
            serverUrl = serverUrl.substr(0, serverUrl.length - 1);
        this._serverUrl = serverUrl;
        this._channels = new Map();
        this._isDisposed = false;
    }
    subscribe(channel, event, handler) {
        n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        n_defensive_1.given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        n_defensive_1.given(handler, "handler").ensureHasValue().ensureIsFunction();
        if (!this._channels.has(channel))
            this._channels.set(channel, this.createChannel(channel));
        const socket = this._channels.get(channel);
        socket.on(event, handler);
    }
    unsubscribe(channel, event, handler) {
        n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
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
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            for (const value of this._channels.values())
                value.close();
        }
        return Promise.resolve();
    }
    createChannel(channel) {
        n_defensive_1.given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        return SocketIOClient.connect(`${this._serverUrl}/${channel}`, {
            transports: ["websocket"]
        });
    }
}
exports.SocketFrontEndClient = SocketFrontEndClient;
//# sourceMappingURL=socket-frontend-client.js.map