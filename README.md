**pqc-gateway** is a [PQC gateway](https://github.com/pqfif-oss/web/wiki/Gemini-:-What's-PQC-Gateway%3F) developed based on pipy proxy (https://github.com/flomesh-io/pipy), which uses the OpenSSL 3.5 cryptography library.

The configuration of pqc-gateway adopts the standard Gateway API (https://kubernetes.io/docs/concepts/services-networking/gateway/). Users can run pqc-gateway in two modes:

* Standalone mode. This is usually used for simple scenarios like development and testing. The gateway can be started by specifying a single YAML configuration file.

* Cluster mode. In this mode, multiple nodes can share the configuration to achieve high availability and horizontal scaling.
