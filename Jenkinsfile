// Jenkins credentials this pipeline expects:
//   aws-ecr      Username with password. Username is the AWS access key ID,
//                password is the secret access key. The key needs ECR push.
//   prod-ssh-key SSH private key. Set the credential username to the prod login
//                (ubuntu, or ec2-user on Amazon Linux). That user must be able to run Docker.
// Optional Jenkins environment variable:
//   API_INTERNAL_URL  Backend base URL reachable from the prod container.

pipeline {
  agent { label 'docker-node-kubectl' }
  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }
  environment {
    AWS_REGION = 'us-east-1'
    ECR_REGISTRY = '484247272870.dkr.ecr.us-east-1.amazonaws.com'
    ECR_REPOSITORY = 'calculator/frontend'
    PROD_HOST = 'ec2-54-162-80-137.compute-1.amazonaws.com'
    CONTAINER_NAME = 'calculator-frontend'
    HOST_PORT = '3000'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.SHORT_SHA = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
          env.IMAGE_SHA = "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:${env.SHORT_SHA}"
          env.IMAGE_LATEST = "${env.ECR_REGISTRY}/${env.ECR_REPOSITORY}:latest"
        }
      }
    }

    stage('Build image') {
      steps {
        sh '''#!/usr/bin/env bash
          set -euo pipefail
          docker build -t "$IMAGE_SHA" -t "$IMAGE_LATEST" .    #
        '''
      }
    }

    stage('Push to ECR') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'aws-ecr', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
          sh '''#!/usr/bin/env bash
            set -euo pipefail
            ecr_password() {
              docker run --rm \
                -e AWS_ACCESS_KEY_ID \
                -e AWS_SECRET_ACCESS_KEY \
                -e AWS_DEFAULT_REGION="$AWS_REGION" \
                public.ecr.aws/aws-cli/aws-cli:latest \
                ecr get-login-password --region "$AWS_REGION"
            }
            ecr_password | docker login --username AWS --password-stdin "$ECR_REGISTRY"
            docker push "$IMAGE_SHA"
            docker push "$IMAGE_LATEST"
            docker logout "$ECR_REGISTRY"
          '''
        }
      }
    }

    stage('Deploy to prod') {
      steps {
        withCredentials([
          usernamePassword(credentialsId: 'aws-ecr', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY'),
          sshUserPrivateKey(credentialsId: 'prod-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')
        ]) {
          sh '''#!/usr/bin/env bash
            set -euo pipefail
            chmod 600 "$SSH_KEY"
            mkdir -p "$WORKSPACE/.ssh"
            chmod 700 "$WORKSPACE/.ssh"

            SSH_TARGET="${SSH_USER}@${PROD_HOST}"
            SSH_OPTS=(
              -i "$SSH_KEY"
              -o IdentitiesOnly=yes
              -o StrictHostKeyChecking=accept-new
              -o UserKnownHostsFile="$WORKSPACE/.ssh/known_hosts"
            )

            ecr_password() {
              docker run --rm \
                -e AWS_ACCESS_KEY_ID \
                -e AWS_SECRET_ACCESS_KEY \
                -e AWS_DEFAULT_REGION="$AWS_REGION" \
                public.ecr.aws/aws-cli/aws-cli:latest \
                ecr get-login-password --region "$AWS_REGION"
            }

            ecr_password | ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
              "docker login --username AWS --password-stdin '$ECR_REGISTRY'"

            ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
              "API_INTERNAL_URL=$(printf '%q' "${API_INTERNAL_URL:-}") IMAGE_SHA=$(printf '%q' "$IMAGE_SHA") IMAGE_LATEST=$(printf '%q' "$IMAGE_LATEST") CONTAINER_NAME=$(printf '%q' "$CONTAINER_NAME") HOST_PORT=$(printf '%q' "$HOST_PORT") ECR_REGISTRY=$(printf '%q' "$ECR_REGISTRY") bash -s" <<'REMOTE'
set -euo pipefail
trap 'docker logout "$ECR_REGISTRY" >/dev/null 2>&1 || true' EXIT
docker pull "$IMAGE_SHA"
docker pull "$IMAGE_LATEST"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
if [ -n "${API_INTERNAL_URL}" ]; then
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "${HOST_PORT}:3000" \
    -e "API_INTERNAL_URL=${API_INTERNAL_URL}" \
    "$IMAGE_SHA"
else
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "${HOST_PORT}:3000" \
    "$IMAGE_SHA"
fi
ok=0
for _ in 1 2 3 4 5; do
  if curl -fsS "http://127.0.0.1:${HOST_PORT}/" >/dev/null; then
    ok=1
    break
  fi
  sleep 2
done
test "$ok" = 1
REMOTE
          '''
        }
      }
    }
  }
  post {
    failure {
      echo 'Pipeline failed. If the push did not finish, prod is still running the previous container.'
    }
  }
}
