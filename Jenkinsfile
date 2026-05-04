pipeline {
    agent any

    parameters {
        string(
            name: 'APP_PORT_INPUT',
            defaultValue: '5000',
            description: '🌐 Port sur lequel déployer l\'application (ex: 5000, 5001...)'
        )
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME    = "burnout_dev_container"
        APP_PORT    = "${params.APP_PORT_INPUT ?: '5000'}"
        VENV_DIR    = "/var/jenkins_home/venv/burnout_dev"
        PYTHON      = "/var/jenkins_home/venv/burnout_dev/bin/python"
        PIP         = "/var/jenkins_home/venv/burnout_dev/bin/pip"
    }

    stages {

        stage('0. Prérequis Système') {
            steps {
                sh '''
                echo "Vérification des outils système..."
                command -v python3 || (apt-get update && apt-get install -y python3 python3-venv python3-pip)
                command -v curl || (apt-get update && apt-get install -y curl)
                python3 --version
                curl --version
                '''
            }
        }

        stage('1. Récupération du Code') {
            steps {
                checkout scm
                script {
                    def commitHash = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    echo "🚀 Pipeline lancé sur le commit : ${commitHash}"
                }
            }
        }

        stage('2. Vérification Universelle') {
            parallel {
                stage('Contrôle d\'Intégrité') {
                    steps {
                        sh '''
                        echo "--- Audit de Structure Burnout ---"
                        [ -f "app.py" ] && echo "app.py : OK" || (echo "app.py MANQUANT" && exit 1)
                        [ -f "burnout_model5.pkl" ] && echo "Modèle ML : OK" || (echo "Modèle ML MANQUANT" && exit 1)
                        [ -f "scaler5.pkl" ] && echo "Scaler ML : OK" || (echo "Scaler ML MANQUANT" && exit 1)
                        [ -f "requirements.txt" ] && echo "Requirements : OK" || (echo "Requirements MANQUANT" && exit 1)
                        '''
                    }
                }

                stage('Contrôle Qualité (Lint)') {
                    steps {
                        sh '''
                        echo "=== Analyse de syntaxe Python ==="
                        find . -name "*.py" ! -path "*/venv/*" -exec python3 -m py_compile {} +
                        
                        echo "=== Validation JSON ==="
                        find . -name "*.json" ! -path "*/venv/*" -exec python3 -c "import json; json.load(open('{}'))" \\;
                        
                        echo "=== Audit HTML ==="
                        find templates -name "*.html" -exec python3 -c "
import sys
from html.parser import HTMLParser
class Check(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.void = ['br','hr','img','input','meta','link','base','col','embed','param','source','track','wbr']
    def handle_starttag(self, tag, attrs):
        if tag not in self.void: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.void: return
        if self.stack and self.stack[-1] == tag: self.stack.pop()
        else: print(f'Erreur balise {tag}'); sys.exit(1)
p = Check()
p.feed(open('{}').read())
if p.stack: print('Balises non fermees'); sys.exit(1)
" \\;
                        '''
                    }
                }
            }
        }

        stage('3. Installation & Dépendances') {
            steps {
                sh '''
                echo "Configuration de l'environnement virtuel..."
                [ ! -d "$VENV_DIR" ] && python3 -m venv "$VENV_DIR"
                "$PIP" install --upgrade pip --quiet
                "$PIP" install -r requirements.txt --quiet
                echo "Installation terminée avec succès."
                '''
            }
        }

        stage('4. Validation Modèle ML') {
            steps {
                sh '''
                echo "Test de chargement du modèle Burnout..."
                "$PYTHON" -c "
import joblib, os
model = joblib.load('burnout_model5.pkl')
scaler = joblib.load('scaler5.pkl')
print('✅ Modèle et Scaler chargés avec succès.')
"
                '''
            }
        }

        stage('6. Déploiement & Santé') {
            steps {
                script {
                    sh '''
                    echo "Construction et déploiement du conteneur..."
                    docker build -t ${APP_NAME}:latest .
                    
                    # Nettoyage si déjà existant
                    docker stop ${APP_NAME} || true
                    docker rm ${APP_NAME} || true
                    
                    # Création du réseau si absent
                    docker network create fstm_network 2>/dev/null || true
                    docker network connect fstm_network fstm_jenkins 2>/dev/null || true

                    # Lancement sur le réseau commun
                    docker run -d --name ${APP_NAME} --network fstm_network -p ${APP_PORT}:5000 ${APP_NAME}:latest
                    
                    echo "⏳ Attente du démarrage de l'application..."
                    sleep 15
                    '''

                    // Vérification via le nom du conteneur (inter-container)
                    def appOK = (sh(script: "curl -sf http://${env.APP_NAME}:5000", returnStatus: true) == 0)
                    if (!appOK) {
                        echo "⚠️ L'application ne répond pas. Tentative de redémarrage..."
                        sh "docker restart ${env.APP_NAME}"
                        sleep 15
                        appOK = (sh(script: "curl -sf http://${env.APP_NAME}:5000", returnStatus: true) == 0)
                    }

                    if (appOK) {
                        echo "✅ Application Burnout déployée avec succès !"
                    } else {
                        error "❌ ÉCHEC DU DÉPLOIEMENT : L'application ne répond pas sur le réseau Docker."
                    }
                }
            }
        }

        stage('7. Tests d\'Intégration') {
            steps {
                sh '''
                echo "Lancement des tests de prédiction sur le conteneur actif..."
                # On remplace temporairement localhost par le nom du conteneur pour le test
                sed -i "s/localhost/${APP_NAME}/g" test_predict.py
                "$PYTHON" test_predict.py
                # On remet localhost pour garder le fichier propre
                sed -i "s/${APP_NAME}/localhost/g" test_predict.py
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 Pipeline BURNOUT terminé avec SUCCÈS !"
        }
        failure {
            echo "❌ Pipeline BURNOUT ÉCHOUÉ."
        }
        cleanup {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
