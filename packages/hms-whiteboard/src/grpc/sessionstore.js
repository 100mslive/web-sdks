// @generated by protobuf-ts 2.9.4 with parameter output_javascript_es2015
// @generated from protobuf file "sessionstore.proto" (package "sessionstorepb", syntax proto3)
// tslint:disable
// @generated by protobuf-ts 2.9.4 with parameter output_javascript_es2015
// @generated from protobuf file "sessionstore.proto" (package "sessionstorepb", syntax proto3)
// tslint:disable
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import { WireType } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf enum sessionstorepb.Value.Type
 */
export var Value_Type;
(function (Value_Type) {
    /**
     * @generated from protobuf enum value: NONE = 0;
     */
    Value_Type[Value_Type["NONE"] = 0] = "NONE";
    /**
     * @generated from protobuf enum value: BYTES = 1;
     */
    Value_Type[Value_Type["BYTES"] = 1] = "BYTES";
    /**
     * @generated from protobuf enum value: STRING = 2;
     */
    Value_Type[Value_Type["STRING"] = 2] = "STRING";
    /**
     * @generated from protobuf enum value: INTEGER = 3;
     */
    Value_Type[Value_Type["INTEGER"] = 3] = "INTEGER";
    /**
     * @generated from protobuf enum value: FLOAT = 4;
     */
    Value_Type[Value_Type["FLOAT"] = 4] = "FLOAT";
})(Value_Type || (Value_Type = {}));
// @generated message type with reflection information, may provide speed optimized methods
class HelloRequest$Type extends MessageType {
    constructor() {
        super("sessionstorepb.HelloRequest", [
            { no: 1, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.name = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string name */ 1:
                    message.name = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string name = 1; */
        if (message.name !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.HelloRequest
 */
export const HelloRequest = new HelloRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class HelloResponse$Type extends MessageType {
    constructor() {
        super("sessionstorepb.HelloResponse", [
            { no: 1, name: "response", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.response = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string response */ 1:
                    message.response = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string response = 1; */
        if (message.response !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.response);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.HelloResponse
 */
export const HelloResponse = new HelloResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SubscribeRequest$Type extends MessageType {
    constructor() {
        super("sessionstorepb.SubscribeRequest", [
            { no: 1, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "offset", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.name = "";
        message.offset = 0n;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string name */ 1:
                    message.name = reader.string();
                    break;
                case /* int64 offset */ 2:
                    message.offset = reader.int64().toBigInt();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string name = 1; */
        if (message.name !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        /* int64 offset = 2; */
        if (message.offset !== 0n)
            writer.tag(2, WireType.Varint).int64(message.offset);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.SubscribeRequest
 */
export const SubscribeRequest = new SubscribeRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Event$Type extends MessageType {
    constructor() {
        super("sessionstorepb.Event", [
            { no: 1, name: "message", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "sequence", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.message = "";
        message.sequence = 0n;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string message */ 1:
                    message.message = reader.string();
                    break;
                case /* int64 sequence */ 2:
                    message.sequence = reader.int64().toBigInt();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string message = 1; */
        if (message.message !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.message);
        /* int64 sequence = 2; */
        if (message.sequence !== 0n)
            writer.tag(2, WireType.Varint).int64(message.sequence);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.Event
 */
export const Event = new Event$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Value$Type extends MessageType {
    constructor() {
        super("sessionstorepb.Value", [
            { no: 1, name: "type", kind: "enum", T: () => ["sessionstorepb.Value.Type", Value_Type] },
            { no: 2, name: "number", kind: "scalar", oneof: "data", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 3, name: "float", kind: "scalar", oneof: "data", T: 2 /*ScalarType.FLOAT*/ },
            { no: 4, name: "str", kind: "scalar", oneof: "data", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "raw_bytes", kind: "scalar", oneof: "data", T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.type = 0;
        message.data = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* sessionstorepb.Value.Type type */ 1:
                    message.type = reader.int32();
                    break;
                case /* int64 number */ 2:
                    message.data = {
                        oneofKind: "number",
                        number: reader.int64().toBigInt()
                    };
                    break;
                case /* float float */ 3:
                    message.data = {
                        oneofKind: "float",
                        float: reader.float()
                    };
                    break;
                case /* string str */ 4:
                    message.data = {
                        oneofKind: "str",
                        str: reader.string()
                    };
                    break;
                case /* bytes raw_bytes */ 5:
                    message.data = {
                        oneofKind: "rawBytes",
                        rawBytes: reader.bytes()
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* sessionstorepb.Value.Type type = 1; */
        if (message.type !== 0)
            writer.tag(1, WireType.Varint).int32(message.type);
        /* int64 number = 2; */
        if (message.data.oneofKind === "number")
            writer.tag(2, WireType.Varint).int64(message.data.number);
        /* float float = 3; */
        if (message.data.oneofKind === "float")
            writer.tag(3, WireType.Bit32).float(message.data.float);
        /* string str = 4; */
        if (message.data.oneofKind === "str")
            writer.tag(4, WireType.LengthDelimited).string(message.data.str);
        /* bytes raw_bytes = 5; */
        if (message.data.oneofKind === "rawBytes")
            writer.tag(5, WireType.LengthDelimited).bytes(message.data.rawBytes);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.Value
 */
export const Value = new Value$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetRequest$Type extends MessageType {
    constructor() {
        super("sessionstorepb.GetRequest", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.GetRequest
 */
export const GetRequest = new GetRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetResponse$Type extends MessageType {
    constructor() {
        super("sessionstorepb.GetResponse", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "namespace", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "value", kind: "message", T: () => Value }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        message.namespace = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                case /* string namespace */ 2:
                    message.namespace = reader.string();
                    break;
                case /* sessionstorepb.Value value */ 3:
                    message.value = Value.internalBinaryRead(reader, reader.uint32(), options, message.value);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        /* string namespace = 2; */
        if (message.namespace !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.namespace);
        /* sessionstorepb.Value value = 3; */
        if (message.value)
            Value.internalBinaryWrite(message.value, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.GetResponse
 */
export const GetResponse = new GetResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeleteRequest$Type extends MessageType {
    constructor() {
        super("sessionstorepb.DeleteRequest", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.DeleteRequest
 */
export const DeleteRequest = new DeleteRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeleteResponse$Type extends MessageType {
    constructor() {
        super("sessionstorepb.DeleteResponse", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        return target !== null && target !== void 0 ? target : this.create();
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.DeleteResponse
 */
export const DeleteResponse = new DeleteResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetRequest$Type extends MessageType {
    constructor() {
        super("sessionstorepb.SetRequest", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "value", kind: "message", T: () => Value }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.key = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                case /* sessionstorepb.Value value */ 3:
                    message.value = Value.internalBinaryRead(reader, reader.uint32(), options, message.value);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        /* sessionstorepb.Value value = 3; */
        if (message.value)
            Value.internalBinaryWrite(message.value, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.SetRequest
 */
export const SetRequest = new SetRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetResponse$Type extends MessageType {
    constructor() {
        super("sessionstorepb.SetResponse", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        return target !== null && target !== void 0 ? target : this.create();
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.SetResponse
 */
export const SetResponse = new SetResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ChangeStream$Type extends MessageType {
    constructor() {
        super("sessionstorepb.ChangeStream", [
            { no: 1, name: "change_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "namespace", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "value", kind: "message", T: () => Value },
            { no: 5, name: "from_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.changeId = "";
        message.key = "";
        message.namespace = "";
        message.fromId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string change_id */ 1:
                    message.changeId = reader.string();
                    break;
                case /* string key */ 2:
                    message.key = reader.string();
                    break;
                case /* string namespace */ 3:
                    message.namespace = reader.string();
                    break;
                case /* sessionstorepb.Value value */ 4:
                    message.value = Value.internalBinaryRead(reader, reader.uint32(), options, message.value);
                    break;
                case /* string from_id */ 5:
                    message.fromId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string change_id = 1; */
        if (message.changeId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.changeId);
        /* string key = 2; */
        if (message.key !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.key);
        /* string namespace = 3; */
        if (message.namespace !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.namespace);
        /* sessionstorepb.Value value = 4; */
        if (message.value)
            Value.internalBinaryWrite(message.value, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        /* string from_id = 5; */
        if (message.fromId !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.fromId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.ChangeStream
 */
export const ChangeStream = new ChangeStream$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Select$Type extends MessageType {
    constructor() {
        super("sessionstorepb.Select", [
            { no: 1, name: "all", kind: "scalar", oneof: "match", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "key", kind: "scalar", oneof: "match", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "prefix", kind: "scalar", oneof: "match", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "suffix", kind: "scalar", oneof: "match", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.match = { oneofKind: undefined };
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string all */ 1:
                    message.match = {
                        oneofKind: "all",
                        all: reader.string()
                    };
                    break;
                case /* string key */ 2:
                    message.match = {
                        oneofKind: "key",
                        key: reader.string()
                    };
                    break;
                case /* string prefix */ 3:
                    message.match = {
                        oneofKind: "prefix",
                        prefix: reader.string()
                    };
                    break;
                case /* string suffix */ 4:
                    message.match = {
                        oneofKind: "suffix",
                        suffix: reader.string()
                    };
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string all = 1; */
        if (message.match.oneofKind === "all")
            writer.tag(1, WireType.LengthDelimited).string(message.match.all);
        /* string key = 2; */
        if (message.match.oneofKind === "key")
            writer.tag(2, WireType.LengthDelimited).string(message.match.key);
        /* string prefix = 3; */
        if (message.match.oneofKind === "prefix")
            writer.tag(3, WireType.LengthDelimited).string(message.match.prefix);
        /* string suffix = 4; */
        if (message.match.oneofKind === "suffix")
            writer.tag(4, WireType.LengthDelimited).string(message.match.suffix);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.Select
 */
export const Select = new Select$Type();
// @generated message type with reflection information, may provide speed optimized methods
class OpenRequest$Type extends MessageType {
    constructor() {
        super("sessionstorepb.OpenRequest", [
            { no: 1, name: "change_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "select", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Select }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.changeId = "";
        message.select = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target !== null && target !== void 0 ? target : this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string change_id */ 1:
                    message.changeId = reader.string();
                    break;
                case /* repeated sessionstorepb.Select select */ 3:
                    message.select.push(Select.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string change_id = 1; */
        if (message.changeId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.changeId);
        /* repeated sessionstorepb.Select select = 3; */
        for (let i = 0; i < message.select.length; i++)
            Select.internalBinaryWrite(message.select[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message sessionstorepb.OpenRequest
 */
export const OpenRequest = new OpenRequest$Type();
/**
 * @generated ServiceType for protobuf service sessionstorepb.Api
 */
export const Api = new ServiceType("sessionstorepb.Api", [
    { name: "Hello", options: {}, I: HelloRequest, O: HelloResponse },
    { name: "Subscribe", serverStreaming: true, options: {}, I: SubscribeRequest, O: Event }
]);
/**
 * @generated ServiceType for protobuf service sessionstorepb.Store
 */
export const Store = new ServiceType("sessionstorepb.Store", [
    { name: "open", serverStreaming: true, options: {}, I: OpenRequest, O: ChangeStream },
    { name: "get", options: {}, I: GetRequest, O: GetResponse },
    { name: "set", options: {}, I: SetRequest, O: SetResponse },
    { name: "delete", options: {}, I: DeleteRequest, O: DeleteResponse }
]);
