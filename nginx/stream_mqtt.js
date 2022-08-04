const MQTT_DISCONNECT = Uint8Array.of(224, 0);

const PACKET_TYPE = [
    "0",
    "connect",
    "connack",
    "publish",
    "puback",
    "pubrec",
    "pubrel",
    "pubcomp",
    "subscribe",
    "suback",
    "unsubscribe",
    "unsuback",
    "pingreq",
    "pingresp",
    "disconnect",
    "15",
]; 

function filter(s) {
    s.on('upload', async function(data, flags) {
        const packet_type = getPacketType(data);
        const topics = getTopics(packet_type, data);

        switch (packet_type) {
            case "subscribe":
            case "publish":
                if (topics.length == 0) {
                    s.send(data, flags);
                    return;
                }

                if (topics.includes("topic1")) {
                    s.log(packet_type + " to " + topics);
                    s.send(data, flags); // !!!!!!!! this s.send(...) works, because it's called synchronously
                } else {
                    s.log("calling http://google.com/")
                    const reply = await ngx.fetch("http://google.com/", {
                        method: "GET"
                    });
                    const reply_text = await reply.text();
                    s.log("reply text from google.com:" + reply_text);
                    s.log(packet_type + " to " + topics);
                    s.send(data, flags); // !!!!!!!! this s.send(...) doesn't work, because it's called asynchronously
                }
                return;
            default:
                s.send(data, flags);
                return;
        }
    });
}

function getTopics(packet_type, data) {
    switch (packet_type) {
        case "subscribe":
            return getTopicsFromSubscribe(data);
        case "publish":
            return getTopicsFromPublish(data);
        default:
            return [];
    }
}

function getTopicsFromSubscribe(data) {
    let cursor = skipFixedHeader(data);
    cursor += 2; // skip variable header (packet identifier)
    const topics = [];
    while (cursor < data.length) {
        const topicname_length = data.charCodeAt(cursor)*256 + data.charCodeAt(cursor + 1);
        cursor += 2; // skip length bytes (2 bytes)
        topics.push(data.slice(cursor, cursor + topicname_length));
        cursor += topicname_length + 1; // skip topicname and Requested QoS byte
    }
    return topics;
}

function getTopicsFromPublish(data) {
    let cursor = skipFixedHeader(data);
    const topics = [];
    const topicname_length = data.charCodeAt(cursor)*256 + data.charCodeAt(cursor + 1);
    cursor += 2; // skip length bytes (2 bytes)
    topics.push(data.slice(cursor, cursor + topicname_length));
    return topics;
}

function skipFixedHeader(data) {
    let cursor = 1; // skipped packet type byte
    // skipping the Remaining Length field (Variable Byte Integer)
    // increment the cursor until we reach the place after the first value where the first bit is 0
    while (data.charCodeAt(cursor++) > 127);
    return cursor;
}

function getPacketType(data) {
    return PACKET_TYPE[data.charCodeAt(0) >> 4];
}

export default { filter };
