# 🔥 Employee Burnout Prediction — Web App

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Complete-brightgreen?style=for-the-badge" />
</p>

> **Application web interactive** permettant de prédire le risque de burnout chez les employés à partir de données professionnelles, en combinant un modèle de Machine Learning (régression logistique) et un système de règles métier.

---

## 📸 Aperçu

L'utilisateur remplit un formulaire avec ses informations professionnelles, et l'application retourne instantanément :
- Le **niveau de risque** (faible ✅ / modéré ⚠️ / élevé 🔴 / très élevé 🚨)
- La **probabilité de burnout** en pourcentage

---

## 🎯 Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🧠 **Prédiction ML** | Modèle de régression logistique entraîné sur des données synthétiques RH |
| 📏 **Règles métier** | Système de scoring basé sur le stress, les heures, la satisfaction et le télétravail |
| ⚖️ **Score hybride** | Combinaison pondérée : 30 % ML + 70 % règles métier |
| 🌐 **Interface web** | Formulaire interactif avec résultat immédiat |
| 🎨 **Design soigné** | UI moderne avec gradient, cartes ombrées et responsive |

---

## 🛠️ Technologies

| Outil | Utilisation |
|---|---|
| **Python 3.12** | Langage principal |
| **Flask** | Framework web (backend + routing) |
| **Scikit-learn** | Entraînement du modèle & `StandardScaler` |
| **Pandas** | Prétraitement des données & one-hot encoding |
| **Joblib** | Sérialisation du modèle (`.pkl`) |
| **HTML / CSS** | Interface utilisateur |

---

## 📊 Dataset

- **Source** : [Kaggle — Synthetic HR Burnout Dataset](https://www.kaggle.com/datasets/ankam6010/synthetic-hr-burnout-dataset)
- **Variable cible** : `Burnout` (0 = Pas de burnout, 1 = Burnout)

### Features utilisées

| Feature | Type | Description |
|---|---|---|
| `Age` | Numérique | Âge de l'employé |
| `Experience` | Numérique | Années d'expérience |
| `WorkHoursPerWeek` | Numérique | Heures travaillées par semaine |
| `RemoteRatio` | Numérique | Pourcentage de télétravail (0–100) |
| `SatisfactionLevel` | Numérique | Niveau de satisfaction (1–5) |
| `StressLevel` | Numérique | Niveau de stress (1–10) |
| `Gender` | Catégoriel | Genre (encodé via one-hot) |
| `JobRole` | Catégoriel | Rôle : Analyst, Engineer, HR, Manager, Sales |

---

## ⚙️ Pipeline ML

```
Données CSV
   │
   ▼
Prétraitement (suppression "Name", One-hot encoding)
   │
   ▼
Normalisation (StandardScaler)
   │
   ▼
Split 80/20 stratifié
   │
   ▼
Régression Logistique (class_weight="balanced")
   │
   ▼
Seuil de décision à 0.80
   │
   ▼
Export du modèle (.pkl) + scaler (.pkl)
```

---

## 📈 Résultats du modèle

| Métrique | Score |
|---|---|
| **Accuracy** | 96.25 % |
| **Recall (Burnout)** | 88.46 % |
| **Precision (Burnout)** | 65.71 % |

---

## 🧮 Système de scoring hybride

La prédiction finale combine deux approches :

```
Score final = (ML × 0.30) + (Règles métier × 0.70)
```

### Règles métier

| Facteur | Condition | Points |
|---|---|---|
| 🔴 Stress | ≥ 8 → +50 · ≥ 6 → +35 · ≥ 4 → +15 | 0–50 |
| ⏰ Heures/sem | ≥ 60 → +40 · ≥ 50 → +25 · ≥ 45 → +10 | 0–40 |
| 😞 Satisfaction | ≤ 1.5 → +35 · ≤ 2.5 → +20 · ≤ 3.0 → +10 | 0–35 |
| 🏠 Télétravail | < 20 % ET stress ≥ 5 → +15 | 0–15 |

### Interprétation

| Probabilité | Résultat |
|---|---|
| < 20 % | ✅ Risque faible |
| 20 – 44 % | ⚠️ Risque modéré |
| 45 – 69 % | 🔴 Risque élevé |
| ≥ 70 % | 🚨 Risque très élevé |

---

## 📁 Structure du projet

```
Burnout_Detection/
├── app.py                  # Application Flask (routes + logique de prédiction)
├── burnout_model5.pkl      # Modèle de régression logistique sérialisé
├── scaler5.pkl             # StandardScaler sérialisé
├── templates/
│   └── index.html          # Interface utilisateur (formulaire + résultat)
├── static/
│   └── style.css           # Styles CSS (design responsive)
└── README.md
```

---

## 🚀 Installation & Lancement

### 1. Cloner le dépôt

```bash
git clone https://github.com/iamsamahaziz/BurnoutProject.git
cd BurnoutProject
```

### 2. Installer les dépendances

```bash
pip install flask pandas scikit-learn joblib
```

### 3. Lancer l'application

```bash
python app.py
```

### 4. Ouvrir dans le navigateur

```
http://127.0.0.1:5000
```

---

## 👤 Auteur

**Samah AZIZ**  
Étudiante en Licence Ingénierie Informatique — FST Mohammedia

[![GitHub](https://img.shields.io/badge/GitHub-iamsamahaziz-181717?style=flat-square&logo=github)](https://github.com/iamsamahaziz)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-samah--az-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/samah-az)

---

<p align="center">
  Made with ❤️ & Python
</p>
