// Configuration - À MODIFIER AVEC VOTRE IP
const API_URL = 'http://localhost:8080';

// Récupérer les infos
const routerId = localStorage.getItem('router_id');
const mac = localStorage.getItem('mac');

// Éléments DOM
const loadingEl = document.getElementById('loading');
const plansContainer = document.getElementById('plansContainer');
const plansList = document.getElementById('plansList');
const sessionActive = document.getElementById('sessionActive');
const sessionInfo = document.getElementById('sessionInfo');

// Au chargement
document.addEventListener('DOMContentLoaded', () => {
    if (!routerId || !mac) {
        loadingEl.innerHTML = '<p style="color: red;">Configuration manquante. Veuillez vous reconnecter au WiFi.</p>';
        return;
    }
    
    checkSession();
    fetchProfiles();
});

// Vérifier si une session existe déjà
async function checkSession() {
    try {
        const response = await fetch(`${API_URL}/sessions/check?router_id=${routerId}&mac=${mac}`);
        const data = await response.json();
        
        if (data.active) {
            // Session active - cacher les forfaits
            loadingEl.style.display = 'none';
            sessionActive.style.display = 'block';
            sessionInfo.innerText = `Session valable jusqu'au ${new Date(data.expires_at).toLocaleString()}`;
            return true;
        }
        return false;
    } catch (error) {
        console.log('Aucune session active');
        return false;
    }
}

// Récupérer les forfaits
async function fetchProfiles() {
    try {
        const response = await fetch(`${API_URL}/routers/${routerId}/profiles`);
        const profiles = await response.json();
        
        loadingEl.style.display = 'none';
        plansContainer.style.display = 'block';
        
        if (profiles.length === 0) {
            plansList.innerHTML = '<div class="plan-card"><p>Aucun forfait disponible pour le moment</p></div>';
            return;
        }
        
        displayPlans(profiles);
    } catch (error) {
        loadingEl.innerHTML = '<p style="color: rgba(255,255,255,0.9);">Erreur de connexion au serveur. Veuillez réessayer.</p>';
        console.error('Erreur:', error);
    }
}

// Afficher les forfaits
function displayPlans(profiles) {
    plansList.innerHTML = profiles.map((profile, index) => `
        <div class="plan-card ${index === 1 ? 'popular' : ''}">
            ${index === 1 ? '<div class="popular-badge">POPULAIRE</div>' : ''}
            <div class="plan-icon">
                <i class="fas ${getPlanIcon(index)}"></i>
            </div>
            <h3>${escapeHtml(profile.profile_name)}</h3>
            <div class="price">
                ${profile.price} <span class="currency">${profile.currency || 'XOF'}</span>
            </div>
            <div class="duration">
                <i class="far fa-clock"></i> ${formatDuration(profile.duration_minutes)}
            </div>
            <ul class="features">
                <li><i class="fas fa-check-circle"></i> Connexion haut débit</li>
                <li><i class="fas fa-check-circle"></i> Support prioritaire</li>
                ${profile.bandwidth_limit ? `<li><i class="fas fa-check-circle"></i> Débit: ${profile.bandwidth_limit}</li>` : ''}
            </ul>
            <button class="btn btn-primary" onclick="initiatePayment(${profile.id})">
                <i class="fas fa-shopping-cart"></i> Choisir ce forfait
            </button>
        </div>
    `).join('');
}

// Icône selon l'index
function getPlanIcon(index) {
    const icons = ['fa-hourglass-half', 'fa-bolt', 'fa-gem', 'fa-wifi'];
    return icons[index] || 'fa-wifi';
}

// Formater la durée
function formatDuration(minutes) {
    if (minutes >= 1440) {
        const days = Math.floor(minutes / 1440);
        return `${days} jour${days > 1 ? 's' : ''}`;
    }
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

// Initier le paiement
async function initiatePayment(profileId) {
    try {
        // Afficher un indicateur de chargement
        const btns = document.querySelectorAll('.btn-primary');
        btns.forEach(btn => btn.disabled = true);
        
        const response = await fetch(`${API_URL}/api/payments/initiate-portal?router_id=${routerId}&profile_id=${profileId}&mac=${mac}`);
        const data = await response.json();
        
        if (data.paydunya_url) {
            // Rediriger vers PayDunya
            window.location.href = data.paydunya_url;
        } else {
            alert('Erreur lors de l\'initiation du paiement');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
        console.error('Erreur:', error);
    } finally {
        const btns = document.querySelectorAll('.btn-primary');
        btns.forEach(btn => btn.disabled = false);
    }
}

// Échapper le HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}