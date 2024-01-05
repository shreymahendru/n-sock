/// <reference types="node" resolution-mode="require"/>
import { Server } from "node:http";
import { RedisClientType } from "redis";
import { Disposable } from "@nivinjoseph/n-util";
/**
 * This should only manage socket connections, should not emit (publish) or listen (subscribe)??
 */
export declare class SocketServer implements Disposable {
    private readonly _socketServer;
    private readonly _redisClient;
    private _isDisposed;
    private _disposePromise;
    constructor(httpServer: Server, corsOrigin: string, redisClient: RedisClientType<any, any, any>);
    dispose(): Promise<void>;
    private _initialize;
}
//# sourceMappingURL=socket-server.d.ts.map