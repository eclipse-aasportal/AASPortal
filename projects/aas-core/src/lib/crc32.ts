/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export class Crc32 {
    private readonly table: number[];
    private crc = 0;

    public constructor(private readonly reversedPolynomial = 0xedb88320) {
        this.table = this.generate();
    }

    public start(): void {
        this.crc = this.initial();
    }

    public add(str: string): void {
        for (let i = 0; i < str.length; i++) {
            this.crc = this.addByte(this.table, this.crc, str.charCodeAt(i));
        }
    }

    public end(): number {
        return this.final(this.crc);
    }

    public computeString(str: string): number {
        let crc = this.initial();
        for (let i = 0; i < str.length; i++) {
            crc = this.addByte(this.table, crc, str.charCodeAt(i));
        }

        return this.final(crc);
    }

    public computeBuffer(data: ArrayBufferLike): number {
        const dataView = new DataView(data);
        const table = this.generate();
        let crc = this.initial();
        for (let i = 0; i < dataView.byteLength; i++) {
            crc = this.addByte(table, crc, dataView.getUint8(i));
        }

        return this.final(crc);
    }

    public reverse(polynomial: number): number {
        let reversedPolynomial = 0;
        for (let i = 0; i < 32; i++) {
            reversedPolynomial = reversedPolynomial << 1;
            reversedPolynomial = reversedPolynomial | ((polynomial >>> i) & 1);
        }

        return reversedPolynomial;
    }

    private generate(): number[] {
        const table: number[] = [];
        for (let i = 0; i < 256; i++) {
            let n = i;
            for (let j = 8; j > 0; j--) {
                if ((n & 1) == 1) {
                    n = (n >>> 1) ^ this.reversedPolynomial;
                } else {
                    n = n >>> 1;
                }
            }

            table[i] = n;
        }

        return table;
    }

    private initial(): number {
        return 0xffffffff;
    }

    private addByte(table: number[], crc: number, byte: number): number {
        crc = (crc >>> 8) ^ table[byte ^ (crc & 0x000000ff)];
        return crc;
    }

    private final(crc: number): number {
        crc = ~crc;
        crc = crc < 0 ? 0xffffffff + crc + 1 : crc;
        return crc;
    }
}
