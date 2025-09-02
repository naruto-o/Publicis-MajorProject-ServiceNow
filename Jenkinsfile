pipeline {
    agent any
 
    environment {
        DOCKER_IMAGE = "shikhar200/majorproject-app"
        DOCKER_TAG   = "latest"
    }
 
    stages {
 
        stage('Checkout') {
            steps {
                git credentialsId: 'github_credentials',
                    branch: 'master',
                    url: 'https://github.com/naruto-o/Publicis_MajorProject_Devops_InventoryManagement.git'
            }
        }
 
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🛠️ Building Docker image..."
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }
 
        stage('Push Docker Image') {
            steps {
                script {
                    echo "📦 Logging in and pushing Docker image..."
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-credentials') {
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    }
                    echo "✅ Docker image pushed: ${DOCKER_IMAGE}:${DOCKER_TAG}"
                }
            }
        }
 
        stage('Deploy to Kubernetes') {
            steps {
                withAWS(credentials: 'aws-eks-creds', region: 'ap-south-1') {
                    script {
                        sh """
                            echo "🔄 Updating kubeconfig..."
                            aws eks update-kubeconfig --region ap-south-1 --name shikhar-test-cluster
 
                            echo "🚀 Updating deployment image in Kubernetes..."
                            kubectl set image deployment/inventory-app \
                                inventory-app=${DOCKER_IMAGE}:${DOCKER_TAG} --record
 
                            echo "⏳ Waiting for rollout to complete..."
                            kubectl rollout status deployment/inventory-app
                        """
                    }
                }
            }
        }
    }
 
    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}