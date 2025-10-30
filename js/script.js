// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const fetchButton = document.getElementById('getImageBtn')

// store fetched items so multiple functions can use them
let apodItems = null;

// Small collection of space facts — pick one at random on page load
const SPACE_FACTS = [
    "Venus rotates backwards — the Sun rises in the west there.",
    "A day on Venus is longer than a year on Venus (it rotates very slowly).",
    "There are more trees on Earth than stars in the Milky Way — but the Milky Way still has billions of stars.",
    "Neutron stars can spin hundreds of times per second and are incredibly dense — a sugar-cube-sized amount of neutron-star material would weigh about a billion tons.",
    "Space is not completely empty — it's filled with low-density gas, dust, and radiation.",
    "A spoonful of the Sun's core would weigh millions of tons on Earth because of the extreme density and pressure.",
    "Jupiter's magnetosphere is so large it would appear bigger than the full Moon in our sky if it were visible.",
    "Saturn isn't the only planet with rings — Jupiter, Uranus and Neptune also have ring systems.",
    "Footprints on the Moon can last for millions of years because there's no wind or water to erode them.",
    "On Mars, sunsets appear blue due to the way dust in the atmosphere scatters sunlight."
];

function showRandomFact(){
    const el = document.getElementById('randomFact');
    if (!el) return;
    const fact = SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)];
    el.textContent = fact;
}

// On load, fetch the JSON and pick a random video for the hero background
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const resp = await fetch(apodData);
        if (!resp.ok) return;
        const data = await resp.json();
        apodItems = data;
        loadRandomHeroVideo(data);
        // show a random fact on page load
        showRandomFact();
    } catch (e) {
        // ignore — hero will remain empty
        console.warn('Could not load hero video', e);
    }
});

async function getPictures(){
    const loading = document.getElementById('loadingOverlay');
    try {
        if (loading) {
            loading.classList.remove('hidden');
            loading.setAttribute('aria-hidden', 'false');
        }

        const resp = await fetch(apodData);
        const data = await resp.json();

        renderGallery(data);
    } 
     finally {
        if (loading) {
            loading.classList.add('hidden');
            loading.setAttribute('aria-hidden', 'true');
        }
    }
}

function setLoading(show){
    const loading = document.getElementById('loadingOverlay');
    if (!loading) return;
    if (show) {
        loading.classList.remove('hidden');
        loading.setAttribute('aria-hidden', 'false');
    } else {
        loading.classList.add('hidden');
        loading.setAttribute('aria-hidden', 'true');
    }
}


function renderGallery(items){
    const gallery = document.getElementById('gallery');
    

    gallery.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'gallery-item';

        let thumb = '';
        if (item.media_type === 'image') {
            thumb = item.hdurl || item.url || '';
        } else if (item.media_type === 'video') {
            thumb = item.thumbnail_url || '';
        }

        const media = document.createElement('div');
        if (thumb) {
            const img = document.createElement('img');
            img.src = thumb;
            img.alt = item.title || 'NASA image';
            media.appendChild(img);
        } else {
            const box = document.createElement('div');
            box.style.height = '200px';
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.background = '#eee';
            box.textContent = item.media_type === 'video' ? 'Video' : 'No preview';
            media.appendChild(box);
        }

        const meta = document.createElement('div');
        meta.style.padding = '8px';
        const title = document.createElement('h3');
        title.textContent = item.title || '';
        const date = document.createElement('p');
        date.textContent = item.date || '';
        date.style.fontSize = '13px';
        date.style.color = '#666';

        meta.appendChild(title);
        meta.appendChild(date);

        card.appendChild(media);
        card.appendChild(meta);

        card.addEventListener('click', () => openModal(item));

        gallery.appendChild(card);
    });
}

if (fetchButton) fetchButton.addEventListener('click', getPictures);

/* Modal logic */
const modal = document.getElementById('myModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalCloseBtn = modal ? modal.querySelector('.close') : null;

function openModal(item){
    if (!modal) return;
    // Clear previous
    modalMedia.innerHTML = '';
    modalTitle.textContent = item.title || '';
    modalDate.textContent = item.date || '';
    modalExplanation.textContent = item.explanation || '';

    if (item.media_type === 'image'){
        const largeSrc = item.hdurl || item.url || '';
        const img = document.createElement('img');
        img.src = largeSrc;
        img.alt = item.title || 'NASA image';
        modalMedia.appendChild(img);
    } else if (item.media_type === 'video'){
        // embed video if url is an embeddable src (YouTube embed), otherwise show thumbnail and link
        if (item.url && item.url.includes('youtube.com')){
            const iframe = document.createElement('iframe');
            iframe.src = item.url;
            iframe.frameBorder = '0';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            modalMedia.appendChild(iframe);
        } else if (item.thumbnail_url){
            const img = document.createElement('img');
            img.src = item.thumbnail_url;
            img.alt = item.title || 'Video thumbnail';
            modalMedia.appendChild(img);
        }
        // also provide a link to open the video in a new tab
        if (item.url){
            const link = document.createElement('p');
            link.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener">Open video in new tab</a>`;
            modalMedia.appendChild(link);
        }
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    // focus close button for accessibility
    if (modalCloseBtn) modalCloseBtn.focus();
}

function closeModal(){
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

// Close interactions
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
// click outside modal-content closes
if (modal) modal.addEventListener('click', (ev) => {
    if (ev.target === modal) closeModal();
});
// ESC key closes
document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
});

/** Load a random video entry into the hero media area. If the item has a YouTube embed URL
 * we add an iframe with autoplay and muted (so browsers allow autoplay). Otherwise, try
 * to insert a native video element or fallback to thumbnail image.
 */
function loadRandomHeroVideo(items){
    if (!Array.isArray(items) || items.length === 0) return;
    const videos = items.filter(i => i.media_type === 'video');
    if (!videos || videos.length === 0) return;
    const rand = videos[Math.floor(Math.random() * videos.length)];
    const hero = document.getElementById('heroMedia');
    if (!hero) return;
    hero.innerHTML = '';

    // Prefer YouTube embed if present
    const url = rand.url || '';
    try {
        if (url.includes('youtube.com') || url.includes('youtu.be')){
            // extract a YouTube id when possible
            const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
            const id = ytMatch ? ytMatch[1] : null;
            let embedBase = null;
            if (id) {
                embedBase = `https://www.youtube.com/embed/${id}`;
            } else if (url.includes('/embed/')){
                // already an embed URL
                embedBase = url.split('?')[0];
            }

            if (embedBase) {
                // autoplay muted required by many browsers; include loop only when id is known (playlist param)
                const params = id ? `?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1` : `?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1`;
                const iframe = document.createElement('iframe');
                iframe.src = embedBase + params;
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay');
                iframe.allowFullscreen = true;
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                hero.appendChild(iframe);
                return;
            }
        }

        // If not a YouTube URL but has thumbnail, show thumbnail image
        if (rand.thumbnail_url){
            const img = document.createElement('img');
            img.src = rand.thumbnail_url;
            img.alt = rand.title || 'Hero video thumbnail';
            img.style.width = '100%';
            img.style.height = '100%';
            hero.appendChild(img);
            return;
        }

        // Try native video element if url points to an mp4 or similar
        if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)){
            const vid = document.createElement('video');
            vid.src = url;
            vid.autoplay = true;
            vid.muted = true;
            vid.loop = true;
            vid.playsInline = true;
            vid.style.width = '100%';
            vid.style.height = '100%';
            vid.style.objectFit = 'cover';
            hero.appendChild(vid);
            // try to play (some browsers require a promise)
            vid.play().catch(()=>{});
            return;
        }
    } catch (e) {
        console.warn('Failed to create hero media', e);
    }

    // final fallback: use any thumbnail or leave blank
    if (rand.thumbnail_url){
        const img = document.createElement('img');
        img.src = rand.thumbnail_url;
        img.alt = rand.title || 'Hero video thumbnail';
        hero.appendChild(img);
    }
}