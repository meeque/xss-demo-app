XSS Demo App TLS Configuration
==============================

Drop a TLS certificate and private key into this directory to enable TLS for the XSS Demo App running in this Docker container!

The expected filenames are:

```
xss-demo-app.cert.pem
xss-demo-app.key.pem
```

Consider mounting this whole directory from the Docker host and manage the certificate and the private key there.
If so, make sure that the files are accessible by the `nginx` user running inside this Docker container.

The presence or absence of this README.txt file does not affect TLS configuration.
