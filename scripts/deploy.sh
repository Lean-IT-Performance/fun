#!/usr/bin/env bash
# Wrapper de déploiement multi-plateforme
# Utilise le script Node deploy-simple.js

SITE=${1:-all}
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Vérifier que Node.js est installé
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Veuillez l'installer d'abord." >&2
  exit 1
fi

node "$SCRIPT_DIR/deploy-simple.js" "$SITE"

