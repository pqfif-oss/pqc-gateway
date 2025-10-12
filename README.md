## Introduction
**pqc-gateway** is a [PQC gateway](https://github.com/pqfif-oss/web/wiki/Gemini-:-What's-PQC-Gateway%3F) developed based on pipy proxy (https://github.com/flomesh-io/pipy), which uses the OpenSSL 3.5 cryptography library.

The configuration of pqc-gateway adopts the standard Gateway API (https://kubernetes.io/docs/concepts/services-networking/gateway/). Users can run pqc-gateway in two modes:

* Standalone mode. This is usually used for simple scenarios like development and testing. The gateway can be started by specifying a single YAML configuration file.

* Cluster mode. In this mode, multiple nodes can share the configuration to achieve high availability and horizontal scaling.

## Build
~~~~~bash
git clone git@github.com:pqfif-oss/pqc-gateway.git
cd pqc-gateway
git submodule update --init
make
sudo make install
~~~~~

And verify:
~~~~~bash
caishu@caishu-macair4 pqc-gateway % gw -v
Version:
  Tag    : 
  Commit : c49e5bb9d128d2c6a2f720564384675b45851091
  Date   : Sun, 12 Oct 2025 11:40:45 +0800
Pipy Version:
  Tag    : 2.0.0-alpha.1
  Commit : 72a6d5eb7a7d38a7c326f076b07a803bf84f1f1c
  Date   : Sat, 11 Oct 2025 11:38:14 +0800
caishu@caishu-macair4 pqc-gateway % gw -h

PQC-enabled Gateway

Usage: gw -c <dirname/filename> [-w|--watch] [-d|--debug]
   or: gw -s <dirname[:[ip:]port]>
   or: gw -v
   or: gw -h

Options:
  -c, --config <dirname/filename>      Point to the configuration file or directory
  -s, --serve  <dirname[:[ip:]port]>   Start configuration server with specified directory
  -w, --watch                          Monitor configuration changes and perform live updates
  -d, --debug                          Print debugging log for each request
  -v, --version                        Print version information
  -h, --help                           Print help information
~~~~~

## Try Simple Sample

### Start pgc-gateway
~~~~~bash
caishu@caishu-macair4 pqc-gateway % gw -c examples/pqc-termination/config.yaml
2025-10-12 22:52:35.506 [INF] [listener] Listening on TCP port 9443 at 0.0.0.0
2025-10-12 22:52:35.506 [INF] FGW started
~~~~~

### Verify from openssl s_client
~~~~~bash
caishu@caishu-macair4 pqc-gateway % openssl s_client -connect 127.0.0.1:9443 -tls1_3 -groups MLKEM768 -servername a.b.example.com
Connecting to 127.0.0.1
CONNECTED(00000003)
depth=0 CN=a.b.example.com
verify error:num=18:self-signed certificate
verify return:1
depth=0 CN=a.b.example.com
verify return:1
---
Certificate chain
 0 s:CN=a.b.example.com
   i:CN=a.b.example.com
   a:PKEY: ML-DSA-44, 10496 (bit); sigalg: ML-DSA-44
   v:NotBefore: Oct  9 02:08:12 2025 GMT; NotAfter: Oct  7 02:08:12 2035 GMT
---
Server certificate
-----BEGIN CERTIFICATE-----
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
AAAAER8sPA==
-----END CERTIFICATE-----
subject=CN=a.b.example.com
issuer=CN=a.b.example.com
---
No client certificate CA names sent
Peer signature type: mldsa44
Negotiated TLS1.3 group: MLKEM768
---
SSL handshake has read 7723 bytes and written 1465 bytes
Verification error: self-signed certificate
---
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Protocol: TLSv1.3
Server public key is 10496 bit
This TLS version forbids renegotiation.
Compression: NONE
Expansion: NONE
No ALPN negotiated
Early data was not sent
Verify return code: 18 (self-signed certificate)
---
---
Post-Handshake New Session Ticket arrived:
SSL-Session:
    Protocol  : TLSv1.3
    Cipher    : TLS_AES_256_GCM_SHA384
    Session-ID: AFA89783092302B51FDB380A4843159F2908C70E84AA69C992D343C59170491D
    Session-ID-ctx: 
    Resumption PSK: 6697AFA580D3D33EBA6DCCF2C104EBDAB5D0F6DB1E02205BCABB41105E583BCDC2BFAC367BF4C95499C4CC9793FFE5E2
    PSK identity: None
    PSK identity hint: None
    SRP username: None
    TLS session ticket lifetime hint: 7200 (seconds)
    TLS session ticket:
    0000 - 73 af 56 08 5c c0 a8 00-7b 8d 87 a0 2e 7c f7 a1   s.V.\...{....|..
    0010 - d0 29 67 98 79 0c b4 91-71 74 b5 fc af 02 da a9   .)g.y...qt......
    0020 - 02 f9 39 22 fd 11 00 8c-4b 60 e3 a3 8c e7 17 ad   ..9"....K`......
    0030 - 1c 59 98 c2 36 02 24 1d-14 ef 54 b8 05 0a 37 d9   .Y..6.$...T...7.
    0040 - 46 19 fd 03 37 d0 51 ed-07 f3 a3 1a ff ca 06 a9   F...7.Q.........
    0050 - f4 da ba e1 f7 77 07 bd-16 3b 05 b4 3c 94 a1 20   .....w...;..<.. 
    0060 - 38 8b 42 88 2c 9e d2 c3-8e bf 6c 8d b2 1d 0f 33   8.B.,.....l....3
    0070 - c3 94 9b 94 21 4b f3 bc-22 27 66 b0 04 95 f1 37   ....!K.."'f....7
    0080 - 74 1e e7 6f a6 ae ef 1f-82 38 72 10 9c 69 17 90   t..o.....8r..i..
    0090 - 62 55 1d 1e f1 f1 38 7f-14 71 fc 20 9a a8 8e 03   bU....8..q. ....
    00a0 - 1c 4c 94 0d f0 e8 8f f3-4c be 19 0d b9 9b fe 27   .L......L......'
    00b0 - 7f 5b 29 51 a5 7d 29 5e-5e 8a 90 12 72 b7 a7 b4   .[)Q.})^^...r...
    00c0 - c1 53 69 9c 06 28 ad 16-4a e3 ad bf f4 ed 95 e3   .Si..(..J.......
    00d0 - 2a f0 ca 57 1a b2 af 85-38 85 8b 7d 7b 47 57 6d   *..W....8..}{GWm

    Start Time: 1760280809
    Timeout   : 7200 (sec)
    Verify return code: 18 (self-signed certificate)
    Extended master secret: no
    Max Early Data: 0
---
read R BLOCK
---
Post-Handshake New Session Ticket arrived:
SSL-Session:
    Protocol  : TLSv1.3
    Cipher    : TLS_AES_256_GCM_SHA384
    Session-ID: F687D4CBC84EA5E904C627AE7E37E2D5A289743EADD7C53E3F0C9734A1C9F33D
    Session-ID-ctx: 
    Resumption PSK: 7EB2ACA287F617881C74DAF626632FE684FC0C519FCC3843BCCA24ECC55D07A145463D1CF675B807587120D730D98E4C
    PSK identity: None
    PSK identity hint: None
    SRP username: None
    TLS session ticket lifetime hint: 7200 (seconds)
    TLS session ticket:
    0000 - 73 af 56 08 5c c0 a8 00-7b 8d 87 a0 2e 7c f7 a1   s.V.\...{....|..
    0010 - 62 a2 ab ec 1c 51 59 cd-1e 1b e2 26 b7 c0 a6 c2   b....QY....&....
    0020 - 7a 08 9c 52 b4 2b 3e 7f-ca cb a0 0a 94 23 38 0e   z..R.+>......#8.
    0030 - 32 85 22 61 22 25 33 47-03 65 49 cf c3 2d 1b e7   2."a"%3G.eI..-..
    0040 - af 8a 94 6c d8 e8 81 80-4d 63 72 20 d9 f5 25 11   ...l....Mcr ..%.
    0050 - ff a6 b7 62 30 2b 95 72-69 03 5b 7a 02 56 6b 03   ...b0+.ri.[z.Vk.
    0060 - 5f 27 0f 82 21 03 cf fb-55 cd ca 01 c5 6e e4 8a   _'..!...U....n..
    0070 - 69 2f 80 68 cd aa 01 6d-b6 09 1e c9 97 aa 31 eb   i/.h...m......1.
    0080 - 01 a0 88 c7 cc 2b 33 ed-c8 53 0f 19 bc 65 ee 9e   .....+3..S...e..
    0090 - 92 d4 8c 19 47 28 3f fa-a5 a8 98 b5 92 12 c7 5f   ....G(?........_
    00a0 - dc 09 87 bc b1 f8 38 0b-29 23 5f f7 7a 4c 41 8f   ......8.)#_.zLA.
    00b0 - 32 39 fe bf c4 ec 43 fd-cf 56 86 ae f2 46 c2 a9   29....C..V...F..
    00c0 - 0b 8d 38 03 18 e1 6c ab-a1 1f b0 d0 8f a1 3b 56   ..8...l.......;V
    00d0 - 27 68 cc b5 81 4b 72 b3-f0 b1 67 49 73 f8 0e f2   'h...Kr...gIs...

    Start Time: 1760280809
    Timeout   : 7200 (sec)
    Verify return code: 18 (self-signed certificate)
    Extended master secret: no
    Max Early Data: 0
---
read R BLOCK
~~~~~
