# Kubernetes Deployment

This guide covers deploying AASPortal in Kubernetes environments, including support for ingress sub-path deployment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Basic Deployment](#basic-deployment)
- [Ingress Configuration](#ingress-configuration)
- [Environment Variables](#environment-variables)
- [High Availability Setup](#high-availability-setup)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured to access your cluster
- Container registry access (DockerHub or private registry)
- Ingress controller (nginx-ingress recommended)

## Basic Deployment

### Simple Root Path Deployment

Deploy AASPortal at the root path (`/`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aas-portal
  namespace: aasportal
  labels:
    app: aas-portal
spec:
  replicas: 1
  selector:
    matchLabels:
      app: aas-portal
  template:
    metadata:
      labels:
        app: aas-portal
    spec:
      containers:
      - name: aas-portal
        image: fraunhoferiosb/aasportal:latest
        ports:
        - containerPort: 80
          name: http
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: aas-portal-service
  namespace: aasportal
spec:
  selector:
    app: aas-portal
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

Apply the deployment:

```bash
kubectl create namespace aasportal
kubectl apply -f deployment.yaml
```

## Ingress Configuration

### Root Path Ingress

Simple ingress for root path deployment:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aas-portal-ingress
  namespace: aasportal
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
  - host: aasportal.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: aas-portal-service
            port:
              number: 80
```

### Sub-Path Deployment with BASE_HREF

**New in v2.0:** AASPortal supports deployment under any sub-path using the `BASE_HREF` environment variable.

#### Step 1: Configure Deployment with BASE_HREF

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aas-portal
  namespace: aasportal
spec:
  template:
    spec:
      containers:
      - name: aas-portal
        image: fraunhoferiosb/aasportal:latest
        env:
        - name: BASE_HREF
          value: "/aasportal/"  # Must end with /
        ports:
        - containerPort: 80
```

#### Step 2: Configure Ingress with Path Rewriting

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aas-portal-ingress
  namespace: aasportal
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - host: services.example.com
    http:
      paths:
      - path: /aasportal(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: aas-portal-service
            port:
              number: 80
```

**Important Notes:**
- `BASE_HREF` value must match the ingress path (e.g., `/aasportal/`)
- Both values must end with a trailing slash (`/`)
- The ingress annotation `nginx.ingress.kubernetes.io/rewrite-target: /$2` is required for proper routing

#### Example: Multiple Applications Under Different Paths

You can deploy multiple instances of AASPortal or other applications under different paths:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-service-ingress
  namespace: aasportal
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - host: services.example.com
    http:
      paths:
      # AASPortal for production
      - path: /aasportal(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: aas-portal-prod-service
            port:
              number: 80
      # AASPortal for development
      - path: /aasportal-dev(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: aas-portal-dev-service
            port:
              number: 80
```

Remember to set the corresponding `BASE_HREF` in each deployment:
- Production: `BASE_HREF=/aasportal/`
- Development: `BASE_HREF=/aasportal-dev/`

### TLS/HTTPS Configuration

Enable HTTPS with cert-manager:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aas-portal-ingress
  namespace: aasportal
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - aasportal.example.com
    secretName: aas-portal-tls
  rules:
  - host: aasportal.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: aas-portal-service
            port:
              number: 80
```

## Environment Variables

AASPortal supports the following Kubernetes-specific environment variables:

### Frontend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BASE_HREF` | Base path for the application (e.g., `/aasportal/`) | `/` | No |

**Example:**
```yaml
env:
- name: BASE_HREF
  value: "/aasportal/"
```

### Backend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AAS_NODE_PORT` | Port where AASNode listens | `80` | No |
| `USER_STORAGE` | MongoDB connection string for user management | `./users` | No |
| `ENDPOINTS` | Initial AAS container endpoints (JSON array) | `["file:///samples"]` | No |
| `JWT_SECRET` | Secret for JWT token signing | - | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |
| `MAX_WORKERS` | Number of background workers | `8` | No |

**Example with ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aas-portal-config
  namespace: aasportal
data:
  BASE_HREF: "/aasportal/"
  AAS_NODE_PORT: "80"
  ENDPOINTS: '["https://aas-server.example.com"]'
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: aas-portal
        envFrom:
        - configMapRef:
            name: aas-portal-config
```

**Example with Secrets:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: aas-portal-secrets
  namespace: aasportal
type: Opaque
stringData:
  JWT_SECRET: "your-super-secret-jwt-key-change-in-production"
  USER_STORAGE: "mongodb://username:password@mongodb:27017/aasportal-users"
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: aas-portal
        envFrom:
        - secretRef:
            name: aas-portal-secrets
```

## High Availability Setup

### Horizontal Pod Autoscaling

Enable automatic scaling based on CPU usage:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aas-portal-hpa
  namespace: aasportal
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: aas-portal
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Pod Disruption Budget

Ensure availability during cluster maintenance:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: aas-portal-pdb
  namespace: aasportal
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: aas-portal
```

### Multi-Zone Deployment

Distribute pods across availability zones:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aas-portal
  namespace: aasportal
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: aas-portal
              topologyKey: topology.kubernetes.io/zone
```

## Monitoring and Logging

### Prometheus Monitoring

Add Prometheus annotations for metrics collection:

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "80"
        prometheus.io/path: "/metrics"
```

### Centralized Logging

Configure log collection with Fluent Bit:

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      annotations:
        fluentbit.io/parser: json
    spec:
      containers:
      - name: aas-portal
        env:
        - name: LOG_FORMAT
          value: "json"
        - name: LOG_LEVEL
          value: "info"
```

## Troubleshooting

### Common Issues

#### 1. Assets Not Loading Under Sub-Path

**Symptom:** CSS, JavaScript, or images return 404 when deployed under a sub-path.

**Solution:** Ensure `BASE_HREF` is set correctly:

```bash
# Check pod environment
kubectl exec -it <pod-name> -n aasportal -- env | grep BASE_HREF

# Check container logs for BASE_HREF setting
kubectl logs <pod-name> -n aasportal | grep "Setting BASE_HREF"
```

Expected output:
```
Setting BASE_HREF to: /aasportal/
```

#### 2. Ingress Path Not Working

**Symptom:** Application returns 404 or shows wrong content.

**Solution:** Verify ingress configuration:

```bash
# Check ingress status
kubectl get ingress -n aasportal
kubectl describe ingress aas-portal-ingress -n aasportal

# Check ingress controller logs
kubectl logs -n ingress-nginx <ingress-controller-pod>
```

Ensure:
- Path regex matches: `/aasportal(/|$)(.*)`
- Rewrite target is set: `nginx.ingress.kubernetes.io/rewrite-target: /$2`
- `BASE_HREF` matches ingress path

#### 3. Pod Crashes or Restarts

**Symptom:** Pods are in CrashLoopBackOff state.

**Solution:** Check pod logs and events:

```bash
# View recent logs
kubectl logs <pod-name> -n aasportal --tail=100

# View events
kubectl describe pod <pod-name> -n aasportal

# Check resource usage
kubectl top pod <pod-name> -n aasportal
```

#### 4. CORS Issues

**Symptom:** Browser console shows CORS errors.

**Solution:** Configure CORS_ORIGIN environment variable:

```yaml
env:
- name: CORS_ORIGIN
  value: "https://aasportal.example.com"
```

### Debugging Commands

```bash
# Get all resources
kubectl get all -n aasportal

# Check pod status
kubectl get pods -n aasportal -o wide

# View detailed pod information
kubectl describe pod <pod-name> -n aasportal

# Execute commands in pod
kubectl exec -it <pod-name> -n aasportal -- /bin/sh

# Port forward for local testing
kubectl port-forward -n aasportal service/aas-portal-service 8080:80

# View config.js content (verify BASE_HREF injection)
kubectl exec <pod-name> -n aasportal -- cat /usr/share/nginx/html/config.js
```

### Health Checks

Verify deployment health:

```bash
# Check deployment status
kubectl rollout status deployment/aas-portal -n aasportal

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n aasportal -- \
  wget -O- http://aas-portal-service/

# Test from outside cluster (if using LoadBalancer)
curl -I http://<external-ip>/
```

## Migration from Docker Compose

If you're migrating from Docker Compose to Kubernetes:

1. **Environment Variables:** Convert `.env` files to ConfigMaps and Secrets
2. **Volumes:** Replace Docker volumes with PersistentVolumeClaims
3. **Networking:** Replace Docker networks with Kubernetes Services
4. **Health Checks:** Convert Docker healthchecks to Kubernetes probes

Example PersistentVolumeClaim for data persistence:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: aas-portal-data
  namespace: aasportal
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [nginx-ingress Documentation](https://kubernetes.github.io/ingress-nginx/)
- [AASPortal GitHub Repository](https://github.com/eclipse-aasportal/AASPortal)
- [Issue #38: Runtime BASE_HREF Support](https://github.com/eclipse-aasportal/AASPortal/issues/38)
