# Portfolio Helm Chart

Minimal Kubernetes deployment configuration with all values fixed, no complex setup required.

## Quick Start

### Install
```bash
helm install portfolio ./portfolio
```

### Scale replicas
```bash
helm install portfolio ./portfolio \
  --set replicaCount=3
```

### Use different image
```bash
helm install portfolio ./portfolio \
  --set image.tag=v1.0.0
```

### Custom domain
```bash
helm install portfolio ./portfolio \
  --set ingress.host=your-domain.com
```

## Included Resources

- **Deployment**: Portfolio application (1 replica by default)
- **Service**: Routes traffic to Pods
- **Ingress**: External access entry point (portfolio.fullstackjam.com)

## Fixed Configuration

- **Application Name**: `portfolio`
- **Port**: `80`

## Configurable Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `replicaCount` | `1` | Number of Pod replicas |
| `image.repository` | `fullstackjam/portfolio` | Image repository |
| `image.tag` | `latest` | Image tag |
| `ingress.host` | `portfolio.fullstackjam.com` | Access domain |

## Uninstall

```bash
helm uninstall portfolio
```
