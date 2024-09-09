import { Writable } from 'node:stream'

export class DocumentWriteStream extends Writable {
	private _chunks: Buffer[] = []
	private readonly _finishPromise: Promise<void> | null = null
	private _finishResolve: (() => void) | null = null

	constructor() {
		super()
		this._finishPromise = new Promise<void>(resolve => {
			this._finishResolve = resolve
		})
	}

	override _write(
		chunk: Buffer,
		_: BufferEncoding,
		callback: (error?: Error | null) => void
	): void {
		try {
			this._chunks.push(chunk)
			callback()
		} catch (e) {
			callback(e as Error)
		}
	}

	override _final(callback: (error?: Error | null) => void): void {
		if (this._finishResolve) {
			this._finishResolve()
		}
		callback()
	}

	async getFinalBuffer(): Promise<Buffer> {
		if (this._finishPromise) {
			await this._finishPromise
		}
		return Buffer.concat(this._chunks)
	}
}
