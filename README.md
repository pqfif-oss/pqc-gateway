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
