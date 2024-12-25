/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/** Defines a WebSocket subscription.  */
export abstract class SocketSubscription {
    /** Opens the subscription. */
    public abstract open(): void;

    /** Closes the subscription. */
    public abstract close(): void;
}
