# NginxExample

An example of how in the js_filter handler function s.send(data, flags) works synchronously, but doesn't work asynchronously.

## Prerequisites
(examples given for MacOS)

- Install docker
```shell
brew install docker
```

- Install docker-compose
```shell
brew install docker-compose
```

- Install mosquitto
```shell
brew install mosquitto
```

## Running the example

### Open a console in the NginxExample directory:

- Make sure that you can run the scripts:
```shell
chmod +x ./client/*.sh
```

- Start the app (with rebuilding):
```shell
docker-compose up --build
```
It will show the logs of mosquitto and nginx.

### The case that works
#### In console 2:
- Try to subscribe to topic1 (it should work):
```shell
% ./client/sub.sh 1883 client1 topic1
Client client1 sending CONNECT
Client client1 received CONNACK (0)
Client client1 sending SUBSCRIBE (Mid: 1, Topic: topic1, QoS: 0, Options: 0x00)
Client client1 received SUBACK
Subscribed (mid: 1): 0
```
#### In console 3:
- Try to publish to topic1 (with a different client ID!) (it should work):
```shell
% ./client/pub.sh 1883 client2 topic1 qwe
Client client2 sending CONNECT
Client client2 received CONNACK (0)
Client client2 sending PUBLISH (d0, q0, r0, m1, 'topic1', ... (3 bytes))
Client client2 sending DISCONNECT
```
#### In console 2:
- You can check that the subscriber received the message:
```shell
Client client1 received PUBLISH (d0, q0, r0, m0, 'topic1', ... (3 bytes))
topic1 qwe
```
- Press CTRL-C in console 2 to stop the client

### The case that doesn't work
#### In console 2:
- Try to subscribe to topic2 (it doesn't work):
```shell
% ./client/sub.sh 1883 client1 topic2
Client client1 sending CONNECT
Client client1 received CONNACK (0)
Client client1 sending SUBSCRIBE (Mid: 1, Topic: topic2, QoS: 0, Options: 0x00)
```
...and it's waiting, frozen.
#### In console 1:
- check the logs:
```shell
rp           | 2022/08/03 16:22:53 [info] 25#25: *1 client 172.23.0.1:64638 connected to 0.0.0.0:1883
rp           | 2022/08/03 16:22:53 [info] 25#25: *1 proxy 172.23.0.3:56914 connected to 172.23.0.2:18831
mosquitto    | 1659543773: New connection from 172.23.0.3:56914 on port 18831.
mosquitto    | 1659543773: New client connected from 172.23.0.3:56914 as client1 (p2, c1, k60).
rp           | 2022/08/03 16:22:53 [info] 25#25: *1 js: calling http://google.com/
rp           | 2022/08/03 16:22:54 [info] 25#25: *1 js: reply text from google.com:<HTML><HEAD><meta http-equiv="content-type" content="text/html;charset=utf-8">
rp           | <TITLE>301 Moved</TITLE></HEAD><BODY>
rp           | <H1>301 Moved</H1>
rp           | The document has moved
rp           | <A HREF="http://www.google.com/">here</A>.
rp           | </BODY></HTML>
rp           | 
rp           | 2022/08/03 16:22:54 [info] 25#25: *1 js: subscribe to topic2
```

### Explanation

- I have set up the js_filter handler script to listen to the upload messages.
- In the s.on("upload", ...) callback, I check the MQTT packet type and topics.
- If the topics contain "topic1", I call s.send(data, flags) synchronously.
- Otherwise (like in the non-working example, "topic2"), I call http://google.com/ with ngx.fetch(...). This is an asynchronous call, so I await for the reply (then for the reply text), log the reply text, then call s.send(data, flags).
- As the log shows, the fetch call goes to http://google.com/, and we receive a response which I'm able to log.
- So the s.send(data, flags) line right after that also runs.
- The problem is that calling s.send(...) asynchronously doesn't seem to have any effect.