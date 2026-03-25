# AMS Planning (MEC) – React + Vite

Application React/TypeScript connectée à l’API AMS pour :
- afficher la **liste des employés (MEC)**,
- gérer un **planning semaine** (stations + shifts par jour),
- visualiser les **stations**,
- consulter le **catalogue des shifts**.

## 📋 Fonctionnalités

### 🔐 Authentification AMS
- **Login** via `POST /Login` (Basic Auth) et récupération du token.
- **Persistance** du token en `localStorage`.
- **Auto-logout** si la session expire (401/403).
- **Heartbeat**: ping `GET /` toutes les 4 minutes pour maintenir la session active.

### 🗓️ Planning MEC (vue semaine)
- **Vue semaine** (lundi → dimanche) avec navigation semaine précédente/suivante.
- **Techniciens** en lignes (virtualisées pour les performances).
- **Par jour** :
  - **Shift** sélectionnable (dropdown)
  - **Station** sélectionnable (dropdown basé sur les stations existantes)
- **Filtres** : recherche technicien, filtre par station.
- **Persistance locale** (UX) : stations/shifts par jour sauvegardés en `localStorage`.

### 👥 Liste MEC
- Liste filtrable (recherche, département, actifs uniquement).
- Statistiques (total, actifs, sortis, stations).

### 🛰️ Stations
- Agrégation des techniciens par station (total/actifs/sortis).

### 🧩 Module Shifts
- Catalogue des shifts (codes, libellés, horaires/catégorie).

## 🛠️ Stack technique
- **Frontend** : React + TypeScript
- **UI** : Tailwind CSS
- **Icons** : Lucide
- **Build** : Vite
- **Virtualisation** : `react-window`
- **API** : AMS (`http://46.105.115.223:8181`) + proxy Vite en dev (`/api`)

## 🔌 Endpoints AMS utilisés
- `POST /Login`
- `GET /v1/employee` (MEC)
- `GET /` (heartbeat / keep-alive)

## 🧱 Structure (résumé)
```
src/
  components/
    PlanningGantt.tsx      # Planning semaine (stations + shifts)
    EmployeeList.tsx       # Liste MEC
    StationsView.tsx       # Vue stations
    ShiftsModule.tsx       # Catalogue shifts
    LoginPage.tsx
    LogoutButton.tsx
  contexts/
    AuthContext.tsx
  shifts/
    shiftTypes.ts          # Catalogue shifts
    storage.ts             # Persistance localStorage
    types.ts
  utils/
    api.ts                 # Auth + fetchEmployees + makeApiRequest
  App.tsx
```

## 🔧 Installation & démarrage

### Prérequis
- Node.js 18+ recommandé
- Accès API AMS

### Dev local
```bash
npm install
npm run dev
```

### Variables d’environnement (optionnel)
Créer `.env` à la racine :
```env
VITE_AMS_BASE_URL=http://46.105.115.223:8181
VITE_AMS_API_VER=v1
```

## 🐛 Dépannage rapide

### Le planning / la liste ne charge pas
- Vérifier le token (reconnexion).
- Vérifier que `GET /v1/employee` répond (200).
- En dev : le proxy Vite route via `/api`.

### Problème de ports Vite
- Stopper les instances Vite existantes puis relancer `npm run dev`.

