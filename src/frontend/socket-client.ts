import * as SocketIOClient from "socket.io-client";
import { given } from "@nivinjoseph/n-defensive";
import { Disposable, Mutex } from "@nivinjoseph/n-util";
import { ObjectDisposedException } from "@nivinjoseph/n-exception";


/**
 * This should only listen (subscribe) to events, should not emit (publish)
 */
export class SocketClient implements Disposable
{
    private readonly _serverUrl: string;
    private readonly _master: SocketIOClient.Socket;
    private readonly _channels = new Array<SocketChannel>();
    private readonly _mutex = new Mutex();
    
    private _isDisposed = false;
    private _disposePromise: Promise<any> | null = null;
    
    
    public constructor(serverUrl: string)
    {
        given(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        serverUrl = serverUrl.trim();
        if (serverUrl.endsWith("/"))
            serverUrl = serverUrl.substr(0, serverUrl.length - 1);
        this._serverUrl = serverUrl;    
        
        this._master = SocketIOClient.io(this._serverUrl, {
            // WARNING: in that case, there is no fallback to long-polling
            transports: ["websocket"], // or [ 'websocket', 'polling' ], which is the same thing
        });
    }
    
    
    public async subscribe(channel: string, event: string): Promise<SocketChannelSubscription>
    {
        // should be synchronized;
        
        given(channel, "channel").ensureHasValue().ensureIsString();
        channel = channel.trim();
        
        given(event, "event").ensureHasValue().ensureIsString();
        event = event.trim();
        
        if (this._isDisposed)
            throw new ObjectDisposedException(this);
        
        await this._mutex.lock();
        try
        {
            const socketChannel = this._channels.find(t => t.channel === channel) ?? await this.createChannel(channel);
            
            return socketChannel.subscribe(event);
        }
        finally
        {
            this._mutex.release();
        }
    }
    
    // public async unsubscribe(channel: string, event?: string, handler?: (data: any) => void): Promise<void>
    // {
    //     // should be synchronized
        
    //     given(channel, "channel").ensureHasValue().ensureIsString();
    //     channel = channel.trim();
        
    //     await this._mutex.lock();
    //     try
    //     {
    //         if (!this._channels.has(channel))
    //             return;

    //         const socket = this._channels.get(channel);

    //         if (!event)
    //         {
    //             socket.close();
    //             this._channels.delete(channel);
    //             return;
    //         }

    //         given(event, "event").ensureHasValue().ensureIsString();
    //         event = event.trim();

    //         given(handler as Function, "handler").ensureIsFunction();

    //         socket.off(event, handler || null);
    //     }
    //     finally
    //     {
    //         this._mutex.release();
    //     }
    // }
    
    public dispose(): Promise<void>
    {
        if (this._disposePromise == null)
        {
            this._isDisposed = true;
            this._disposePromise = Promise.all(this._channels.map(t => t.dispose()));
            this._master.close();
        }
        
        return this._disposePromise;
    }
    
    private createChannel(channel: string): Promise<SocketChannel>
    {
        return new Promise((resolve, reject) =>
        {
            try 
            {
                given(channel, "channel").ensureHasValue().ensureIsString();
                channel = channel.trim();

                this._master.once(`n-sock-joined_channel/${channel}`, (data: { channel: string }) =>
                {
                    if (data.channel === channel)
                    {
                        const socket = SocketIOClient.io(`${this._serverUrl}/${channel}`, { transports: ["websocket"] });
                        
                        const socketChannel = new SocketChannel(this._serverUrl, channel, socket, this._master);
                        
                        this._channels.push(socketChannel);
                        
                        resolve(socketChannel);
                    }
                    else
                        reject(new Error(`Joined channel mismatch; expected '${channel}', actual '${data.channel}'`));
                });
                
                
                this._master.emit("n-sock-join_channel", { channel });
            }
            catch (error)
            {
                reject(error);
            }
        });
    }
}


export interface SocketChannelSubscription
{
    eventName: string;
    
    onData(callback: (data: any) => void): this;
    onConnectionChange(callback: () => void): this;
    unsubscribe(): void;
}

class InternalSocketChannelSubscription implements SocketChannelSubscription
{
    private readonly _eventName: string;
    private _isUnsubscribed = false;
    private _eventHandler: (data: any) => void | null = null;
    private _connectionChangeHandler: () => void | null = null;
    private _unsubscribeHandler: () => void;
    
    
    
    public get eventName(): string { return this._eventName; }
    public get eventHandler(): (data: any) => void | null { return this._eventHandler; }
    public get connectionChangeHandler(): () => void | null { return this._connectionChangeHandler; }
    
    
    public constructor(eventName: string)
    {
        given(eventName, "eventName").ensureHasValue().ensureIsString();
        this._eventName = eventName;
    }
    
    
    public onData(callback: (data: any) => void): this
    {
        given(callback, "callback").ensureHasValue().ensureIsFunction();
        this._eventHandler = callback;
        return this;
    }
    
    public onConnectionChange(callback: () => void): this
    {
        given(callback, "callback").ensureHasValue().ensureIsFunction();
        this._connectionChangeHandler = callback;
        return this;
    }
    
    public unsubscribe(): void
    {
        if (this._isUnsubscribed)
            return;
        
        this._unsubscribeHandler();
        
        this._isUnsubscribed = true;
    }
    
    public onUnsubscribe(callback: () => void): void
    {
        given(callback, "callback").ensureHasValue().ensureIsFunction();
        this._unsubscribeHandler = callback;
    }
}

class SocketChannel implements Disposable
{
    private readonly _serverUrl: string;
    private readonly _channel: string;
    private _socket: SocketIOClient.Socket;
    private readonly _master: SocketIOClient.Socket;
    private readonly _eventNames = new Set<string>();
    private readonly _subscriptions = new Array<InternalSocketChannelSubscription>();
    private _isReconnecting = false;
    private _isDisposed: boolean = false;
    
    
    public get channel(): string { return this._channel; }
    

    public constructor(serverUrl: string, channel: string, socket: SocketIOClient.Socket, master: SocketIOClient.Socket)
    {
        given(serverUrl, "serverUrl").ensureHasValue().ensureIsString();
        this._serverUrl = serverUrl;
        
        given(channel, "channel").ensureHasValue().ensureIsString();
        this._channel = channel;
        
        given(socket, "socket").ensureHasValue().ensureIsObject();
        this._socket = socket;
        
        given(master, "master").ensureHasValue().ensureIsObject();
        this._master = master;
        
        this.initialize();
    }
    
    
    public subscribe(eventName: string): SocketChannelSubscription
    {
        given(eventName, "eventName").ensureHasValue().ensureIsString();
        eventName = eventName.trim();
        
        const subscription = new InternalSocketChannelSubscription(eventName);
        
        subscription.onUnsubscribe(() => this._subscriptions.remove(subscription));
        
        this._subscriptions.push(subscription);
        
        if (!this._eventNames.has(eventName))
        {
            this._eventNames.add(eventName);
            
            this._socket.on(eventName, (data: any) =>
            {
                this._subscriptions
                    .where(t => t.eventName === eventName && t.eventHandler != null)
                    .forEach(t => t.eventHandler(data));
            });
        }
        
        return subscription;
    }
    
    public dispose(): Promise<void>
    {
        if (!this._isDisposed)
        {
            this._isDisposed = true;
            this._subscriptions.clear();
            this._socket.off("connect_error");
            this._socket.close();
        }

        return Promise.resolve();
    }
    
    
    private initialize(): void
    {
        this._eventNames.forEach((eventName) =>
        {
            this._socket.on(eventName, (data: any) =>
            {
                this._subscriptions
                    .where(t => t.eventName === eventName && t.eventHandler != null)
                    .forEach(t => t.eventHandler(data));
            });
        });
        
        this._socket.on("connect", () =>
        {
            this._subscriptions.where(t => t.connectionChangeHandler != null).forEach(t => t.connectionChangeHandler());
        });
        
        this._socket.on("connect_error", (err: { message: string }) =>
        {
            console.warn(`SocketChannel connect_error due to ${err.message}`);

            if (err.message?.trim() === "Invalid namespace" && !this._isReconnecting)
            {
                this._isReconnecting = true;
                
                this._master.once(`n-sock-joined_channel/${this._channel}`, (data: { channel: string }) =>
                {
                    try 
                    {
                        if (data.channel === this._channel)
                        {
                            const socket = SocketIOClient.io(`${this._serverUrl}/${this._channel}`,
                                { transports: ["websocket"] });

                            this._socket.off("connect_error");
                            this._socket.close();

                            this._socket = socket;
                            this.initialize();
                        }
                        else
                            throw new Error(`Joined channel mismatch; expected '${this._channel}', actual '${data.channel}'`);
                    }
                    catch (error)
                    {
                        console.error(error);
                    }
                    finally
                    {
                        this._isReconnecting = false;
                    }
                });

                this._master.emit("n-sock-join_channel", { channel: this._channel });
            }
            
            this._subscriptions.where(t => t.connectionChangeHandler != null).forEach(t => t.connectionChangeHandler());
        });
    }
}