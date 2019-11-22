import * as Http from "http";
import { given } from "@nivinjoseph/n-defensive";
import * as SocketIo from "socket.io";
import * as SocketIoRedis from "socket.io-redis";
import { ConfigurationManager } from "@nivinjoseph/n-config";
import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";


/**
 * This should only manage socket connections, should not emit (publish) or listen (subscribe)??
 */
export class SocketServer implements Disposable
{
    private readonly _socketServer: SocketIO.Server;
    private readonly _client: Redis.RedisClient;
    private _isDisposed: boolean;
    private _disposePromise: Promise<void> | null;
    
    
    public constructor(httpServer: Http.Server)
    {
        given(httpServer, "httpServer").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Http.Server);
        
        this._socketServer = SocketIo(httpServer);
        
        this._client = ConfigurationManager.getConfig<string>("env") === "dev"
            ? Redis.createClient() : Redis.createClient(ConfigurationManager.getConfig<string>("REDIS_URL"));

        this._isDisposed = false;
        this._disposePromise = null;
        
        this._socketServer.adapter(SocketIoRedis(this._client as any));
        
        this._socketServer.on("connection", (socket) =>
        {
            console.log("Client connected", socket.id);
        });
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