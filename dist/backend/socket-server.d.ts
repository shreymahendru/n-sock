/// <reference types="node" />
import * as Http from "http";
import { Disposable } from "@nivinjoseph/n-util";
export declare class SocketServer implements Disposable {
    private readonly _socketServer;
    private readonly _redisClient;
    private _isDisposed;
    private _disposePromise;
    constructor(httpServer: Http.Server, redisUrl?: string);
    dispose(): Promise<void>;
    private initialize;
}
