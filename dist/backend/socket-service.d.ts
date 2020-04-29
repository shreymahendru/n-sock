import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";
export declare class SocketService implements Disposable {
    private readonly _socketClient;
    private _isDisposed;
    private _disposePromise;
    constructor(redisClient: Redis.RedisClient);
    publish(channel: string, event: string, data: object): void;
    dispose(): Promise<void>;
}
