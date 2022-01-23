import * as Redis from "redis";
import { Emitter } from "@socket.io/redis-emitter";
import { Disposable } from "@nivinjoseph/n-util";
import { given } from "@nivinjoseph/n-defensive";
import { ObjectDisposedException } from "@nivinjoseph/n-exception";


/**
 * This should only emit (publish) events
 */
export class SocketService implements Disposable
{
    private readonly _socketClient: Emitter;
    private readonly _redisClient: Redis.RedisClient;
    private _isDisposed = false;
    private _disposePromise: Promise<void> | null = null;   
    
    
    public constructor(redisClient: Redis.RedisClient)
    {
        given(redisClient, "redisClient").ensureHasValue().ensureIsObject();
        this._redisClient = redisClient;
        
        this._socketClient = new Emitter(this._redisClient as any);
    }
    
    
    public publish(channel: string, event: string, data: object): void
    {
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();

        given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        
        given(data, "data").ensureHasValue().ensureIsObject();
        
        if (this._isDisposed)
            throw new ObjectDisposedException(this);
        
        this._socketClient.of(`/${channel}`).emit(event, data);
    }
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            this._disposePromise = Promise.resolve();
        }

        return this._disposePromise as Promise<void>;
    }
}