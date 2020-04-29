/// <reference types="node" />
import * as Http from "http";
import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";
export declare class SocketServer implements Disposable {
    private readonly _socketServer;
    private _isDisposed;
    private _disposePromise;
    constructor(httpServer: Http.Server, redisClient: Redis.RedisClient);
    dispose(): Promise<void>;
    private initialize;
}
