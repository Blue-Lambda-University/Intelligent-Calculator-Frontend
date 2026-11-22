#!/bin/sh
set -eu
NAMESPACE="${NAMESPACE:-calculator-staging}"
kubectl -n "$NAMESPACE" rollout undo deployment/calculator-web
kubectl -n "$NAMESPACE" rollout status deployment/calculator-web --timeout=180s
