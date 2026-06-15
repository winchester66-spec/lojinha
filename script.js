// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Function to handle buy button clicks
function handleBuy(productName) {
    // In a real scenario, this would redirect to a checkout URL
    // e.g., window.location.href = "https://pay.hotmart.com/XXXXXX";
    
    alert(`🛒 Você selecionou: ${productName}\n\nAqui você colocará o seu link de pagamento (Hotmart, Kiwify, Mercado Pago, etc). O cliente será redirecionado para a tela de checkout.`);
}

// Fade-in animation on scroll using Intersection Observer
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // Triggers when 15% of the element is visible
};

const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target); // Stop observing once it has faded in
        }
    });
}, observerOptions);

// Select elements to animate
document.addEventListener('DOMContentLoaded', () => {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach((card, index) => {
        // Initial state for animation
        card.style.opacity = 0;
        card.style.transform = 'translateY(40px)';
        // Stagger the transition delay based on index for a cascading effect
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s, border-color 0.3s ease, box-shadow 0.3s ease`;
        
        fadeObserver.observe(card);
    });
    
    // Load grid state on start
    loadGridState();
});

// --- Modal, Edit and State Logic ---
let currentEditingCard = null;

function saveGridState() {
    const cards = Array.from(document.querySelectorAll('.product-card:not(.add-product-card)'));
    const htmlToSave = cards.map(c => c.outerHTML).join('\n');
    localStorage.setItem('storeGridState', htmlToSave);
}

function loadGridState() {
    const addCard = document.querySelector('.add-product-card');
    
    // Se o cartão de adicionar não existir (versão pública), ignoramos a memória
    // para não apagar a vitrine original e quebrar o script.
    if (!addCard) return;

    const saved = localStorage.getItem('storeGridState');
    if (saved) {
        document.querySelectorAll('.product-card:not(.add-product-card)').forEach(c => c.remove());
        addCard.insertAdjacentHTML('beforebegin', saved);
    }
}

function openAddModal() {
    document.getElementById('addProductModal').style.display = 'flex';
}

function closeAddModal() {
    document.getElementById('addProductModal').style.display = 'none';
    document.querySelector('.modal-header h2').innerText = "Adicionar Novo Produto";
    document.getElementById('addProductForm').reset();
    currentEditingCard = null;
}

function editProduct(btn, event) {
    event.stopPropagation();
    const card = btn.closest('.product-card');
    currentEditingCard = card;

    const name = card.querySelector('h3').innerText;
    const priceRaw = card.querySelector('.price').innerText;
    const price = priceRaw.replace('R$ ', '');
    const buyBtn = card.querySelector('.btn-buy');
    
    const onclickStr = buyBtn.getAttribute('onclick');
    let link = "";
    if (onclickStr) {
        const match = onclickStr.match(/'([^']+)'/);
        if (match) link = match[1];
    }
    
    const cardImg = card.querySelector('.card-img');
    let image = "";
    if (cardImg && cardImg.src) {
        image = cardImg.src;
    } else {
        const cardImgLegacy = card.querySelector('.card-image');
        if (cardImgLegacy) {
            const styleImg = cardImgLegacy.style.backgroundImage;
            if (styleImg && styleImg.includes('url(')) {
                image = styleImg.replace('url("', '').replace('")', '').replace("url('", '').replace("')", '');
            }
        }
    }

    document.getElementById('prodName').value = name;
    document.getElementById('prodPrice').value = price;
    document.getElementById('prodLink').value = link;
    document.getElementById('prodImage').value = image.startsWith('http') || image.startsWith('assets') || image.startsWith('file') ? image : "";
    
    document.querySelector('.modal-header h2').innerText = "Editar Produto";
    openAddModal();
}

function handleAddProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('prodName').value;
    const price = document.getElementById('prodPrice').value;
    const link = document.getElementById('prodLink').value;
    const imageUrl = document.getElementById('prodImage').value;
    const imageFile = document.getElementById('prodImageFile').files[0];
    
    const finalizeProduct = (finalImage) => {
        if (currentEditingCard) {
            currentEditingCard.querySelector('h3').innerText = name;
            currentEditingCard.querySelector('.price').innerText = `R$ ${price}`;
            currentEditingCard.querySelector('.btn-buy').setAttribute('onclick', `window.location.href='${link}'`);
            
            if (finalImage && finalImage.trim() !== '') {
                const imgEl = currentEditingCard.querySelector('.card-img');
                if (imgEl) {
                    imgEl.src = finalImage;
                } else {
                    // legacy fallback
                    const legacyDiv = currentEditingCard.querySelector('.card-image');
                    if (legacyDiv) {
                        legacyDiv.style.backgroundImage = `url('${finalImage}')`;
                        legacyDiv.style.backgroundColor = '#1e1e2f';
                    }
                }
            }
            
            saveGridState();
            closeAddModal();
            return;
        }

        renderNewProduct(name, price, link, finalImage);
        saveGridState();
        closeAddModal();
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            finalizeProduct(e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        finalizeProduct(imageUrl);
    }
}

function renderNewProduct(name, price, link, image) {
    const addCard = document.querySelector('.add-product-card');
    
    const imageHTML = image && image.trim() !== ''
        ? `<img class="card-img" src="${image}" alt="${name}">`
        : '';

    const cardHTML = `
        <div class="product-card" style="position: relative;">
            <button class="edit-btn" title="Editar Produto" onclick="editProduct(this, event)">⋮</button>
            <div class="card-image-wrapper" style="background-color: #1e1e2f;">
                ${imageHTML}
            </div>
            <div class="card-content">
                <h3>${name}</h3>
                <div class="price-row">
                    <span class="price">R$ ${price}</span>
                    <button class="btn-buy" onclick="window.location.href='${link}'">Acessar</button>
                </div>
            </div>
        </div>
    `;
    
    if(addCard) {
        addCard.insertAdjacentHTML('beforebegin', cardHTML);
    }
}

// Export logic to make changes permanent
function exportHTML() {
    // Create a clone of the document to clean it up before exporting
    const docClone = document.cloneNode(true);
    
    // Remove inline styles added by the scroll animation so they animate again on reload
    const cards = docClone.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.style.opacity = '';
        card.style.transform = '';
        card.style.transition = '';
    });
    
    // ----------------------------------------------------
    // REMOVE ADMIN TOOLS FROM THE EXPORTED HTML
    // ----------------------------------------------------
    // Remove edit buttons
    docClone.querySelectorAll('.edit-btn').forEach(btn => btn.remove());
    
    // Remove "Adicionar Produto" card
    const addCard = docClone.querySelector('.add-product-card');
    if (addCard) addCard.remove();
    
    // Remove "Salvar Loja" button and its parent li
    const saveBtn = docClone.querySelector('button[onclick="exportHTML()"]');
    if (saveBtn && saveBtn.parentElement) saveBtn.parentElement.remove();
    
    // Remove the modal
    const addModal = docClone.getElementById('addProductModal');
    if (addModal) addModal.remove();
    // ----------------------------------------------------

    // Get the HTML string
    const htmlContent = "<!DOCTYPE html>\n" + docClone.documentElement.outerHTML;
    
    // Clear localStorage so the next load uses the hardcoded HTML without duplicating
    localStorage.removeItem('storeGridState');
    
    // Create download link
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html'; // Generate the clean public file
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("✅ Arquivo 'index.html' gerado com sucesso!\\n\\nEste é o arquivo LIMPO da sua vitrine.\\nBasta arrastar/copiar esse novo 'index.html' para a pasta do seu projeto e enviá-lo para o GitHub.\\n\\nLembre-se: Para continuar editando a loja, abra sempre o arquivo 'admin.html' no seu computador!");
}
