import { Disposable } from "@nivinjoseph/n-util";
/**
 * This should only emit (publish) events
 */
export declare class SocketService implements Disposable {
    private readonly _socketClient;
    private readonly _redisClient;
    private _isDisposed;
    private _disposePromise;
    constructor(redisUrl?: string);
    publish(channel: string, event: string, data: object): void;
    dispose(): Promise<void>;
}
