# Issue #38 Test Report - BASE_HREF Not Recognized Under Ingress Path

## Summary
Successfully reproduced issue #38 where AASPortal fails to work correctly when deployed under a Kubernetes ingress sub-path (e.g., `/aasportal/`).

## Test Environment
- **Platform**: minikube v1.36.0 (local Kubernetes cluster)
- **Ingress Controller**: nginx-ingress (enabled via minikube addon)
- **Test Image**: aas-portal:test2
- **Ingress Path**: `/aasportal/`
- **BASE_HREF Environment Variable**: Set to `/aasportal/` in deployment

## Test Setup

### Deployment Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aas-portal
spec:
  containers:
  - name: aas-portal
    image: aas-portal:test2
    env:
    - name: BASE_HREF
      value: "/aasportal/"
```

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aas-portal-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /aasportal(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: aas-portal-service
            port:
              number: 80
```

## Issue Confirmation

### Problem: BASE_HREF Environment Variable Ignored

When accessing http://192.168.64.2/aasportal/, the HTML contains:

```html
<base href="/">
<link rel="stylesheet" href="styles-EPWVZVRX.css">
<script src="polyfills-UZDKQ4T6.js" type="module"></script>
<script src="main-Y3TUL7ZU.js" type="module"></script>
```

**Expected**: `<base href="/aasportal/">`
**Actual**: `<base href="/">`

### Impact

Because the base href is set to `/` instead of `/aasportal/`, the browser attempts to load assets from:
- ❌ http://192.168.64.2/styles-EPWVZVRX.css (404 Not Found)
- ❌ http://192.168.64.2/polyfills-UZDKQ4T6.js (404 Not Found)
- ❌ http://192.168.64.2/main-Y3TUL7ZU.js (404 Not Found)

Instead of:
- ✅ http://192.168.64.2/aasportal/styles-EPWVZVRX.css (200 OK - confirmed working)
- ✅ http://192.168.64.2/aasportal/polyfills-UZDKQ4T6.js
- ✅ http://192.168.64.2/aasportal/main-Y3TUL7ZU.js

### Verification Tests

```bash
# Test 1: HTML page accessible via ingress path
curl -I http://192.168.64.2/aasportal/
# Result: HTTP/1.1 200 OK ✅

# Test 2: Assets accessible with full ingress path
curl -I http://192.168.64.2/aasportal/styles-EPWVZVRX.css
# Result: HTTP/1.1 200 OK ✅

# Test 3: Assets NOT accessible from root (as browser would try)
curl -I http://192.168.64.2/styles-EPWVZVRX.css
# Result: HTTP/1.1 404 Not Found ❌
```

## Root Cause

The Angular application is built with a **hardcoded** base href at build time. The `BASE_HREF` environment variable passed to the container is **not being used** to dynamically set the `<base>` tag in the HTML.

## Current Build Process

The Angular app is built during Docker image creation:
```dockerfile
RUN npm run aas-portal:build
```

This likely uses a command like:
```bash
ng build --base-href /
```

The base href is **baked into the built assets** and cannot be changed at runtime with environment variables.

## Proposed Solution (from issue #38)

The issue suggests implementing a runtime configuration approach:

1. Create a `config.js` that reads `BASE_HREF` environment variable
2. Modify `index.html` to dynamically set the base tag using this config
3. Update Angular's `main.ts` to use the dynamically set `BASE_HREF`

This would allow the same Docker image to be deployed under any path by simply changing the `BASE_HREF` environment variable.

## Test Artifacts

- **Deployment manifest**: `k8s-test-deployment.yaml`
- **Test Dockerfile**: `Dockerfile.aas-portal-test`
- **Modified nginx config**: `nginx-test.conf`
- **Minikube IP**: 192.168.64.2

## Conclusion

✅ **Issue #38 successfully reproduced**

The current AASPortal application **cannot** be deployed under a Kubernetes ingress sub-path because:
1. The `BASE_HREF` environment variable is ignored
2. The base href is hardcoded to `/` at build time
3. Browser asset loading fails when deployed under a sub-path

The proposed solution to implement runtime BASE_HREF configuration is necessary to support this deployment scenario.
