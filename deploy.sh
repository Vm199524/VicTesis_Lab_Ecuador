#!/usr/bin/env bash
#
# Despliegue rápido de VicTesis Lab · Portal Tesis Ecuador.
# ----------------------------------------------------------------------------
# Frente al antiguo `gcloud run deploy --source .` (que recompila la imagen en
# cada deploy), este flujo separa el BUILD del DEPLOY:
#
#   1) La imagen se compila UNA vez y se sube a Artifact Registry con una etiqueta
#      de fecha. Si Docker está corriendo se construye en local (caché incremental
#      → los deploys siguientes son mucho más rápidos); si no, se delega a Cloud
#      Build remoto.
#   2) El despliegue a Cloud Run se hace por REFERENCIA de imagen (`--image`), sin
#      reenviar el código fuente.
#   3) Un cambio SOLO de interfaz no toca Cloud Run: basta `hosting`.
#
# Las variables de entorno y los límites ya configurados en cada servicio Cloud
# Run se conservan (se guardan en el servicio, no en la imagen); por eso aquí no
# se re-pasan secretos.
#
# Uso (desde la raíz del repo):
#   bash deploy.sh hosting    # frontend: build + Firebase Hosting (segundos)
#   bash deploy.sh portal     # servidor del portal (server.ts / proxies) → Cloud Run
#   bash deploy.sh detector   # servicio de originalidad (services/originality) → Cloud Run
#   bash deploy.sh all        # hosting + portal + detector
#   bash deploy.sh status     # revisiones activas y URLs
#
# Entorno opcional: PROJECT, REGION (por defecto el proyecto y región reales).
set -euo pipefail

PROJECT="${PROJECT:-portal-tesis-ecuador-508108}"
REGION="${REGION:-europe-west1}"
REPO="${REGION}-docker.pkg.dev/${PROJECT}/cloud-run-source-deploy"
STAMP="$(date +%Y%m%d%H%M%S)"

say()  { printf '\033[1;36m== %s ==\033[0m\n' "$*" >&2; }
usage() { sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'; }

docker_up() {
  command -v docker >/dev/null 2>&1 || return 1
  docker info >/dev/null 2>&1
}

# Compila y empuja la imagen <name> desde <dir>. Deja la referencia en $_TAG.
build_and_push() {
  local name="$1" dir="$2"
  _TAG="$REPO/$name:$STAMP"

  if docker_up; then
    say "Docker local activo → build con caché incremental ($name)"
    ( cd "$dir" && docker build --platform linux/amd64 -t "$_TAG" -t "$REPO/$name:latest" . )
    docker push "$_TAG"
    docker push "$REPO/$name:latest"
  else
    say "Docker no está corriendo → Cloud Build remoto ($name)"
    ( cd "$dir" && gcloud builds submit --tag "$_TAG" --project "$PROJECT" . )
    # Mantener también la etiqueta :latest apuntando a esta imagen.
    gcloud artifacts docker tags add "$_TAG" "$REPO/$name:latest" \
      --location="$REGION" --project="$PROJECT" >/dev/null 2>&1 || true
  fi
  say "Imagen lista: $_TAG"
}

cmd_hosting() {
  say "Firebase Hosting (solo frontend; Cloud Run no se toca)"
  npm run build
  firebase deploy --only hosting --project "$PROJECT"
}

cmd_portal() {
  build_and_push portaltesisvm .
  say "Desplegando portaltesisvm por imagen"
  gcloud run deploy portaltesisvm \
    --image "$_TAG" --region "$REGION" --project "$PROJECT" \
    --allow-unauthenticated --quiet
}

cmd_detector() {
  build_and_push portaltesis-originalidad services/originality
  say "Desplegando portaltesis-originalidad por imagen (8 GiB)"
  gcloud run deploy portaltesis-originalidad \
    --image "$_TAG" --region "$REGION" --project "$PROJECT" \
    --allow-unauthenticated --quiet \
    --memory 8Gi --cpu 2 --concurrency 1 --max-instances 2 --timeout 900
}

cmd_status() {
  say "portaltesis-originalidad"
  gcloud run services describe portaltesis-originalidad --region "$REGION" --project "$PROJECT" \
    --format='value(status.url, spec.template.metadata.name)'
  say "portaltesisvm"
  gcloud run services describe portaltesisvm --region "$REGION" --project "$PROJECT" \
    --format='value(status.url, spec.template.metadata.name)'
  say "Hosting"
  firebase hosting:channel:list --project "$PROJECT" 2>/dev/null || true
  echo "https://portaltesis.web.app"
}

case "${1:-}" in
  hosting)  cmd_hosting ;;
  portal)   cmd_portal ;;
  detector) cmd_detector ;;
  all)      cmd_hosting; cmd_portal; cmd_detector ;;
  status)   cmd_status ;;
  *)        usage ;;
esac
