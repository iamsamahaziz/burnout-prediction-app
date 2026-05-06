pipeline {
    agent any

    parameters {
        string(
            name: 'APP_PORT_INPUT',
            defaultValue: '5000',
            description: '🌐 Port sur lequel déployer l\'application (ex: 5000, 5001...) [Uniquement pour les branches de développement/feature]'
        )
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        // Ces variables seront configurées dynamiquement dans la première étape
        VENV_DIR = "${WORKSPACE}/venv"
        PYTHON   = "${WORKSPACE}/venv/bin/python"
        PIP      = "${WORKSPACE}/venv/bin/pip"
    }

    stages {

        stage('1. Préparation de l\'Environnement') {
            steps {
                script {
                    // Détection de la branche
                    def rawBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: "main"
                    def cleanBranch = rawBranch.split('/')[-1]
                    env.BRANCH_SLUG = cleanBranch.replaceAll('[^a-zA-Z0-9]', '_').toLowerCase()

                    echo "Branche détectée : ${env.BRANCH_SLUG}"

                    if (env.BRANCH_SLUG == 'main' || env.BRANCH_SLUG == 'master') {
                        // Configuration Production
                        env.IS_MAIN = 'true'
                        env.APP_NAME = "burnout_tracker"
                        env.APP_PORT = "5000"
                        env.VENV_DIR = "/var/jenkins_home/venv/burnout"
                    } else {
                        // Configuration Développement
                        env.IS_MAIN = 'false'
                        env.APP_NAME = "burnout_dev_${env.BRANCH_SLUG}"
                        env.APP_PORT = "${params.APP_PORT_INPUT ?: '5000'}"
                        env.VENV_DIR = "/var/jenkins_home/venv/burnout_${env.BRANCH_SLUG}"
                    }

                    // On redéfinit les chemins d'environnement virtuel en fonction de VENV_DIR
                    env.PYTHON = "${env.VENV_DIR}/bin/python"
                    env.PIP    = "${env.VENV_DIR}/bin/pip"

                    checkout scm
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

                # Vérifie si tous les packages sont déjà installés
                echo "Vérification des packages..."
                MISSING=$("$PIP" install --dry-run -r requirements.txt -q 2>&1 | grep "Would install" || echo "")

                if [ -z "$MISSING" ]; then
                    echo "Tous les packages déjà installés — rien à faire."
                else
                    echo "Packages manquants : $MISSING"
                    "$PIP" install --upgrade pip -q
                    "$PIP" install -r requirements.txt -q --cache-dir "/var/jenkins_home/.pip_cache"
                    echo "Installation terminée avec succès."
                fi
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

        stage('5. Déploiement & Santé') {
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

        stage('6. Tests d\'Intégration') {
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
            echo "🎉 Pipeline BURNOUT terminé avec SUCCÈS sur la branche ${env.BRANCH_SLUG} !"
        }
        failure {
            script {
                if (env.IS_MAIN == 'false') {
                    echo "Échec détecté sur branche feature : Nettoyage du conteneur éphémère..."
                    sh "docker stop ${env.APP_NAME} || true"
                    sh "docker rm   ${env.APP_NAME} || true"
                } else {
                    echo "Échec détecté sur main — Conteneur de production préservé."
                }
            }
        }
        cleanup {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
