import * as SocketIoEmitter from "socket.io-emitter";
import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";
import { given } from "@nivinjoseph/n-defensive";
import { ApplicationException, ObjectDisposedException } from "@nivinjoseph/n-exception";


/**
 * This should only emit (publish) events
 */
export class SocketService implements Disposable
{
    private readonly _socketClient: SocketIoEmitter.SocketIOEmitter;
    private readonly _redisClient: Redis.RedisClient;
    private _isDisposed = false;
    private _disposePromise: Promise<void> | null = null;   
    
    
    public constructor(redisUrl?: string)
    {
        given(redisUrl, "redisUrl").ensureIsString();
        this._redisClient = (() =>
        {
            try 
            {
                return redisUrl && redisUrl.isNotEmptyOrWhiteSpace()
                    ? Redis.createClient(redisUrl)
                    : Redis.createClient();
            }
            catch (error)
            {
                throw new ApplicationException("Error during redis initialization", error);
            }
        })();
        
        this._socketClient = SocketIoEmitter(this._redisClient as any);
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
            this._disposePromise = new Promise((resolve, _) => this._redisClient.quit(() => resolve()));
        }

        return this._disposePromise as Promise<void>;
    }
}