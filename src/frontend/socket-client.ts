import * as SocketIOClient from "socket.io-client";
import { given } from "@nivinjoseph/n-defensive";
import { Disposable, Mutex } from "@nivinjoseph/n-util";


/**
 * This should only listen (subscribe) to events, should not emit (publish)
 */
export class SocketClient implements Disposable
{
    private readonly _serverUrl: string;
    private readonly _client: SocketIOClient.Socket;
    private readonly _channels = new Map<string, SocketIOClient.Socket>();
    private readonly _mutex = new Mutex();
    
    private _isDisposed = false;
    
    
    public constructor(serverUrl: string)
    {
        given(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        serverUrl = serverUrl.trim();
        if (serverUrl.endsWith("/"))
            serverUrl = serverUrl.substr(0, serverUrl.length - 1);
        this._serverUrl = serverUrl;    
        
        this._client = SocketIOClient.io(this._serverUrl, {
            // WARNING: in that case, there is no fallback to long-polling
            transports: ["websocket"], // or [ 'websocket', 'polling' ], which is the same thing
        });
    }
    
    
    public async subscribe(channel: string, event: string, handler: (data: any) => void): Promise<void>
    {
        // should be synchronized;
        
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        
        given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        
        given(handler, "handler").ensureHasValue().ensureIsFunction();
        
        await this._mutex.lock();
        try
        {
            if (!this._channels.has(channel))
            {
                const socket = await this.createChannel(channel);
                this._channels.set(channel, socket);
            }

            const socket = this._channels.get(channel);

            socket.on(event, handler);
        }
        finally
        {
            this._mutex.release();
        }
    }
    
    public async unsubscribe(channel: string, event?: string, handler?: (data: any) => void): Promise<void>
    {
        // should be synchronized
        
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        
        await this._mutex.lock();
        try
        {
            if (!this._channels.has(channel))
                return;

            const socket = this._channels.get(channel);

            if (!event)
            {
                socket.close();
                this._channels.delete(channel);
                return;
            }

            given(event, "event").ensureHasValue().ensureIsString();
            event = event.trim();

            given(handler as Function, "handler").ensureIsFunction();

            socket.off(event, handler || null);
        }
        finally
        {
            this._mutex.release();
        }
    }
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            
            for (const value of this._channels.values())
                value.close();
            
            this._client.close();
        }
        
        return Promise.resolve();
    }
    
    private createChannel(channel: string): Promise<SocketIOClient.Socket>
    {
        return new Promise((resolve, reject) =>
        {
            try 
            {
                given(channel, "channel").ensureHasValue().ensureIsString();
                channel = channel.trim();

                this._client.once(`n-sock-joined_channel/${channel}`, (data: { channel: string }) =>
                {
                    if (data.channel === channel)
                    {
                        const socket = SocketIOClient.io(`${this._serverUrl}/${channel}`, {
                            // WARNING: in that case, there is no fallback to long-polling
                            transports: ["websocket"], // or [ 'websocket', 'polling' ], which is the same thing
                            upgrade: false
                        });
                        
                        resolve(socket);
                    }
                    else
                        reject(new Error(`Joined channel mismatch; expected '${channel}', actual '${data.channel}'`));
                });
                
                
                this._client.emit("n-sock-join_channel", { channel });
            }
            catch (error)
            {
                reject(error);
            }
        });
    }
}