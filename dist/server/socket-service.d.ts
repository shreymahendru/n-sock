import { Disposable } from "@nivinjoseph/n-util";
import { RedisClientType } from "redis";
/**
 * This should only emit (publish) events
 */
export declare class SocketService implements Disposable {
    private readonly _socketClient;
    private readonly _redisClient;
    private _isDisposed;
    private _disposePromise;
    constructor(redisClient: RedisClientType<any, any, any>);
    publish(channel: string, event: string, data: object): void;
    dispose(): Promise<void>;
}
//# sourceMappingURL=socket-service.d.ts.map