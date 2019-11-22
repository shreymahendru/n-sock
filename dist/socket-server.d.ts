/// <reference types="node" />
import * as Http from "http";
import { Disposable } from "@nivinjoseph/n-util";
export declare class SocketServer implements Disposable {
    private readonly _socketServer;
    private readonly _client;
    private _isDisposed;
    private _disposePromise;
    constructor(httpServer: Http.Server);
    dispose(): Promise<void>;
}
