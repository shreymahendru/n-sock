import Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";
/**
 * This should only emit (publish) events
 */
export declare class SocketService implements Disposable {
    private readonly _socketClient;
    private readonly _redisClient;
    private _isDisposed;
    private _disposePromise;
    constructor(redisClient: Redis.RedisClientType);
    publish(channel: string, event: string, data: object): void;
    dispose(): Promise<void>;
}
//# sourceMappingURL=socket-service.d.ts.map