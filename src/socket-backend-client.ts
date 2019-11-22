import * as SocketIoEmitter from "socket.io-emitter";
import { ConfigurationManager } from "@nivinjoseph/n-config";
import { SocketClient } from "./socket-client";
import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";


export class SocketBackendClient implements SocketClient,  Disposable
{
    private readonly _socketClient: SocketIoEmitter.SocketIOEmitter;
    private readonly _client: Redis.RedisClient;
    private _isDisposed: boolean;
    private _disposePromise: Promise<void> | null;   
    
    
    public constructor()
    {
        this._client = ConfigurationManager.getConfig<string>("env") === "dev"
            ? Redis.createClient() : Redis.createClient(ConfigurationManager.getConfig<string>("REDIS_URL"));

        this._isDisposed = false;
        this._disposePromise = null;
        
        this._socketClient = SocketIoEmitter(this._client as any);
    }
    
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) => this._client.quit(() => resolve()));
        }

        return this._disposePromise as Promise<void>;
    }
}