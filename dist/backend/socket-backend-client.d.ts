import { Disposable } from "@nivinjoseph/n-util";
export declare class SocketBackendClient implements Disposable {
    private readonly _socketClient;
    private readonly _client;
    private _isDisposed;
    private _disposePromise;
    constructor();
    publish(channel: string, event: string, data: object): void;
    dispose(): Promise<void>;
}
