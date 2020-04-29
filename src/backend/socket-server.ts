import * as Http from "http";
import { given } from "@nivinjoseph/n-defensive";
import * as SocketIo from "socket.io";
import * as SocketIoRedis from "socket.io-redis";
import * as Redis from "redis";
import { Disposable } from "@nivinjoseph/n-util";


/**
 * This should only manage socket connections, should not emit (publish) or listen (subscribe)??
 */
export class SocketServer implements Disposable
{
    private readonly _socketServer: SocketIO.Server;
    private _isDisposed = false;
    private _disposePromise: Promise<void> | null = null;
    
    
    public constructor(httpServer: Http.Server, redisClient: Redis.RedisClient)
    {
        given(httpServer, "httpServer").ensureHasValue().ensureIsObject().ensureIsInstanceOf(Http.Server);
        this._socketServer = SocketIo(httpServer, {
            transports: ["websocket"],
            pingInterval: 10000,
            pingTimeout: 5000,
            serveClient: false
        });
        
        given(redisClient, "redisClient").ensureHasValue().ensureIsObject();
        this._socketServer.adapter(SocketIoRedis({
            pubClient: redisClient,
            subClient: redisClient
        }));
        
        this.initialize();
    }   
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            this._disposePromise = new Promise((resolve, _) =>
                this._socketServer.close(() => resolve()));
        }

        return this._disposePromise;
    }
    
    private initialize(): void
    {
        this._socketServer.on("connection", (socket) =>
        {
            console.log("Client connected", socket.id);

            socket.on("n-sock-join_channel", (data: { channel: string }) =>
            {
                given(data, "data").ensureHasValue().ensureIsObject().ensureHasStructure({ channel: "string" });

                console.log(`Client ${socket.id} joining channel ${data.channel}`);
                
                const nsp = this._socketServer.of(`/${data.channel}`);
                
                socket.emit(`n-sock-joined_channel/${data.channel}`, { channel: nsp.name.substr(1) });
                
                console.log(`Client ${socket.id} joined channel ${nsp.name.substr(1)}`);
            });
        });
    }
}