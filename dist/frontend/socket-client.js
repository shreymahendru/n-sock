"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClient = void 0;
const tslib_1 = require("tslib");
const SocketIOClient = require("socket.io-client");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
const n_util_1 = require("@nivinjoseph/n-util");
const n_exception_1 = require("@nivinjoseph/n-exception");
/**
 * This should only listen (subscribe) to events, should not emit (publish)
 */
class SocketClient {
    constructor(serverUrl) {
        this._channels = new Array();
        this._mutex = new n_util_1.Mutex();
        this._isDisposed = false;
        this._disposePromise = null;
        (0, n_defensive_1.given)(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        serverUrl = serverUrl.trim();
        if (serverUrl.endsWith("/"))
            serverUrl = serverUrl.substr(0, serverUrl.length - 1);
        this._serverUrl = serverUrl;
        this._master = SocketIOClient.io(this._serverUrl, {
            // WARNING: in that case, there is no fallback to long-polling
            transports: ["websocket"] // or [ 'websocket', 'polling' ], which is the same thing
        });
    }
    subscribe(channel, event) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // should be synchronized;
            (0, n_defensive_1.given)(channel, "channel").ensureHasValue().ensureIsString();
            channel = channel.trim();
            (0, n_defensive_1.given)(event, "event").ensureHasValue().ensureIsString();
            event = event.trim();
            if (this._isDisposed)
                throw new n_exception_1.ObjectDisposedException(this);
            yield this._mutex.lock();
            try {
                const socketChannel = (_a = this._channels.find(t => t.channel === channel)) !== null && _a !== void 0 ? _a : yield this._createChannel(channel);
                return socketChannel.subscribe(event);
            }
            finally {
                this._mutex.release();
            }
        });
    }
    // public async unsubscribe(channel: string, event?: string, handler?: (data: any) => void): Promise<void>
    // {
    //     // should be synchronized
    //     given(channel, "channel").ensureHasValue().ensureIsString();
    //     channel = channel.trim();
    //     await this._mutex.lock();
    //     try
    //     {
    //         if (!this._channels.has(channel))
    //             return;
    //         const socket = this._channels.get(channel);
    //         if (!event)
    //         {
    //             socket.close();
    //             this._channels.delete(channel);
    //             return;
    //         }
    //         given(event, "event").ensureHasValue().ensureIsString();
    //         event = event.trim();
    //         given(handler as Function, "handler").ensureIsFunction();
    //         socket.off(event, handler || null);
    //     }
    //     finally
    //     {
    //         this._mutex.release();
    //     }
    // }
    dispose() {
        if (this._disposePromise == null) {
            this._isDisposed = true;
            this._disposePromise = Promise.all(this._channels.map(t => t.dispose()));
            this._master.close();
        }
        return this._disposePromise;
    }
    _createChannel(channel) {
        return new Promise((resolve, reject) => {
            try {
                (0, n_defensive_1.given)(channel, "channel").ensureHasValue().ensureIsString();
                channel = channel.trim();
                this._master.once(`n-sock-joined_channel/${channel}`, (data) => {
                    if (data.channel === channel) {
                        const socket = SocketIOClient.io(`${this._serverUrl}/${channel}`, { transports: ["websocket"] });
                        const socketChannel = new SocketChannel(this._serverUrl, channel, socket, this._master);
                        this._channels.push(socketChannel);
                        resolve(socketChannel);
                    }
                    else
                        reject(new Error(`Joined channel mismatch; expected '${channel}', actual '${data.channel}'`));
                });
                this._master.emit("n-sock-join_channel", { channel });
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.SocketClient = SocketClient;
class InternalSocketChannelSubscription {
    constructor(eventName) {
        this._isUnsubscribed = false;
        this._eventHandler = null;
        this._connectionChangeHandler = null;
        this._unsubscribeHandler = null;
        (0, n_defensive_1.given)(eventName, "eventName").ensureHasValue().ensureIsString();
        this._eventName = eventName;
    }
    get eventName() { return this._eventName; }
    get eventHandler() { return this._eventHandler; }
    get connectionChangeHandler() { return this._connectionChangeHandler; }
    onData(callback) {
        (0, n_defensive_1.given)(callback, "callback").ensureHasValue().ensureIsFunction();
        this._eventHandler = callback;
        return this;
    }
    onConnectionChange(callback) {
        (0, n_defensive_1.given)(callback, "callback").ensureHasValue().ensureIsFunction();
        this._connectionChangeHandler = callback;
        return this;
    }
    unsubscribe() {
        if (this._isUnsubscribed)
            return;
        if (this._unsubscribeHandler != null)
            this._unsubscribeHandler();
        this._isUnsubscribed = true;
    }
    onUnsubscribe(callback) {
        (0, n_defensive_1.given)(callback, "callback").ensureHasValue().ensureIsFunction();
        this._unsubscribeHandler = callback;
    }
}
class SocketChannel {
    constructor(serverUrl, channel, socket, master) {
        this._eventNames = new Set();
        this._subscriptions = new Array();
        this._isReconnecting = false;
        this._isDisposed = false;
        (0, n_defensive_1.given)(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        this._serverUrl = serverUrl;
        (0, n_defensive_1.given)(channel, "channel").ensureHasValue().ensureIsString();
        this._channel = channel;
        (0, n_defensive_1.given)(socket, "socket").ensureHasValue().ensureIsObject();
        this._socket = socket;
        (0, n_defensive_1.given)(master, "master").ensureHasValue().ensureIsObject();
        this._master = master;
        this._initialize();
    }
    get channel() { return this._channel; }
    subscribe(eventName) {
        (0, n_defensive_1.given)(eventName, "eventName").ensureHasValue().ensureIsString();
        eventName = eventName.trim();
        const subscription = new InternalSocketChannelSubscription(eventName);
        subscription.onUnsubscribe(() => this._subscriptions.remove(subscription));
        this._subscriptions.push(subscription);
        if (!this._eventNames.has(eventName)) {
            this._eventNames.add(eventName);
            this._socket.on(eventName, (data) => {
                this._subscriptions
                    .where(t => t.eventName === eventName && t.eventHandler != null)
                    .forEach(t => t.eventHandler(data));
            });
        }
        return subscription;
    }
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._subscriptions.clear();
            this._socket.off("connect_error");
            this._socket.close();
        }
        return Promise.resolve();
    }
    _initialize() {
        this._eventNames.forEach((eventName) => {
            this._socket.on(eventName, (data) => {
                this._subscriptions
                    .where(t => t.eventName === eventName && t.eventHandler != null)
                    .forEach(t => t.eventHandler(data));
            });
        });
        this._socket.on("connect", () => {
            this._subscriptions.where(t => t.connectionChangeHandler != null).forEach(t => t.connectionChangeHandler());
        });
        this._socket.on("connect_error", (err) => {
            console.warn(`SocketChannel connect_error due to ${err.message}`);
            if (err.message.trim() === "Invalid namespace" && !this._isReconnecting) {
                this._isReconnecting = true;
                this._master.once(`n-sock-joined_channel/${this._channel}`, (data) => {
                    try {
                        if (data.channel === this._channel) {
                            const socket = SocketIOClient.io(`${this._serverUrl}/${this._channel}`, { transports: ["websocket"] });
                            this._socket.off("connect_error");
                            this._socket.close();
                            this._socket = socket;
                            this._initialize();
                        }
                        else
                            throw new Error(`Joined channel mismatch; expected '${this._channel}', actual '${data.channel}'`);
                    }
                    catch (error) {
                        console.error(error);
                    }
                    finally {
                        this._isReconnecting = false;
                    }
                });
                this._master.emit("n-sock-join_channel", { channel: this._channel });
            }
            this._subscriptions.where(t => t.connectionChangeHandler != null).forEach(t => t.connectionChangeHandler());
        });
    }
}
//# sourceMappingURL=socket-client.js.map