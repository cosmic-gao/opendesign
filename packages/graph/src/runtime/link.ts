import type { SerializedLinkTuple } from './contracts';

export class LLink {
  public id: number | string;
  public type: string | number | null | undefined;
  public origin_id: number | string;
  public origin_slot: number;
  public target_id: number | string;
  public target_slot: number;
  public data: unknown;

  public constructor(
    id: number | string,
    type: string | number | null | undefined,
    origin_id: number | string,
    origin_slot: number,
    target_id: number | string,
    target_slot: number,
  ) {
    this.id = id;
    this.type = type;
    this.origin_id = origin_id;
    this.origin_slot = origin_slot;
    this.target_id = target_id;
    this.target_slot = target_slot;
    this.data = null;
  }

  public configure(o: SerializedLinkTuple | LLink): void {
    if (Array.isArray(o)) {
      this.id = o[0];
      this.origin_id = o[1];
      this.origin_slot = o[2];
      this.target_id = o[3];
      this.target_slot = o[4];
      this.type = o[5];
      return;
    }

    this.id = o.id;
    this.type = o.type;
    this.origin_id = o.origin_id;
    this.origin_slot = o.origin_slot;
    this.target_id = o.target_id;
    this.target_slot = o.target_slot;
    this.data = o.data;
  }

  public serialize(): SerializedLinkTuple {
    return [
      this.id,
      this.origin_id,
      this.origin_slot,
      this.target_id,
      this.target_slot,
      this.type,
    ];
  }
}
