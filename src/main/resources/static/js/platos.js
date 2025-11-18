function initPlatosTabEvents() {
    document.querySelectorAll('.category-content').forEach(function (content) {
        content.style.maxHeight = '0';
        content.dataset.transitioning = 'false';
    });
    document.querySelectorAll('.category-section > h3').forEach(function (h3) {
        h3.addEventListener('click', function () {
            const idx = h3.getAttribute('data-cat-idx');
            const content = document.querySelector('.category-content[data-cat-idx="' + idx + '"]');
            if (!content) {
                return;
            }
            if (content.dataset.transitioning === 'true') {
                return;
            }
            content.dataset.transitioning = 'true';
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = '0';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
            content.addEventListener('transitionend', function handler() {
                content.dataset.transitioning = 'false';
                content.removeEventListener('transitionend', handler);
            });
        });
    });
}

function initPlatoCardToggleEvents() {
    const body = document.body;

    if (body._platoCardHandler) {
        body.removeEventListener('click', body._platoCardHandler);
    }

    body._platoCardHandler = function (e) {
        const card = e.target.closest('.plato-card');
        if (!card) return;

        const isCocinero = card.hasAttribute('data-cocinero');
        const isAdmin = card.hasAttribute('data-admin');
        const plateId = card.getAttribute('data-plate-id');

        if (isCocinero) {
            const currentActive = card.getAttribute('data-active') === 'true';
            const newActive = !currentActive;
            if (!confirm('¿Deseas guardar el cambio?')) {
                return;
            }
            card.style.pointerEvents = 'none';
            fetch('/dashboard/plate/set-active', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `plateId=${plateId}&active=${newActive}`
            })
                .then(response => response.text())
                .then(result => {
                    if (result === 'OK') {
                        card.setAttribute('data-active', newActive);
                        if (newActive) {
                            card.classList.remove('plato-inactivo');
                        } else {
                            card.classList.add('plato-inactivo');
                        }
                    } else {
                        alert(result);
                    }
                    card.style.pointerEvents = '';
                })
                .catch(() => {
                    alert('Error de red');
                    card.style.pointerEvents = '';
                });
        } else if (isAdmin) {
            openUpdatePlateModal(card);
        }
    };

    body.addEventListener('click', body._platoCardHandler);
}

// --- WebSocket para actualización en tiempo real de platos ---
let stompClient = null;
let isPlateStompConnected = false;
let platosInitialized = false;

function connectPlateStatusWebSocket() {
    if (stompClient !== null && isPlateStompConnected) {
        try {
            stompClient.disconnect();
        } catch (e) {
            console.warn('Error al desconectar WebSocket anterior:', e);
        }
    }

    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function () {
        isPlateStompConnected = true;
        stompClient.subscribe('/topic/plate-status', function (message) {
            const plate = JSON.parse(message.body);
            updatePlateStatusInView(plate);
        });
        stompClient.subscribe('/topic/plate-updates', function (message) {
            const plate = JSON.parse(message.body);
            updatePlateInView(plate);
        });
    }, function (error) {
        console.warn('Error connecting STOMP:', error);
        isPlateStompConnected = false;
    });
}

function updatePlateStatusInView(plate) {
    const card = document.querySelector(`.plato-card[data-plate-id="${plate.id}"]`);
    if (card) {
        card.setAttribute('data-active', plate.active);
        card.classList.toggle('plato-inactivo', !plate.active);
    }
}

function openUpdatePlateModal(card) {
    const overlay = document.getElementById('updatePlateModal');
    const form = document.getElementById('updatePlateForm');
    document.getElementById('plateName').value = card.getAttribute('data-name') || '';
    document.getElementById('plateDescription').value = card.getAttribute('data-description') || '';
    document.getElementById('platePrice').value = card.getAttribute('data-price') || '';
    document.getElementById('plateActive').checked = card.getAttribute('data-active') === 'true';
    form.setAttribute('data-plate-id', card.getAttribute('data-plate-id'));
    overlay.style.display = 'flex';
}

function closeUpdatePlateModal() {
    const overlay = document.getElementById('updatePlateModal');
    overlay.style.display = 'none';
}

function updatePlateInView(plate) {
    const card = document.querySelector(`.plato-card[data-plate-id="${plate.id}"]`);
    if (card) {
        card.setAttribute('data-name', plate.name);
        card.setAttribute('data-description', plate.description);
        card.setAttribute('data-price', plate.price);
        card.setAttribute('data-active', plate.active);
        card.setAttribute('data-image-base64', plate.imageBase64 || '');

        let img = card.querySelector('.plato-img');
        const hasImage = plate.imageBase64 && String(plate.imageBase64).trim() !== '';
        if (hasImage) {
            if (!img) {
                img = document.createElement('img');
                img.className = 'plato-img';
                img.alt = 'Imagen del plato';
                const info = card.querySelector('.plato-info');
                if (info) {
                    card.insertBefore(img, info);
                } else {
                    card.appendChild(img);
                }
            }
            img.src = 'data:image/jpeg;base64,' + plate.imageBase64;
            img.style.display = 'block';
        } else {
            if (img) {
                img.remove();
            }
        }

        const nameEl = card.querySelector('h3');
        nameEl.textContent = plate.name;

        const descEl = card.querySelector('p');
        descEl.textContent = plate.description;

        const priceEl = card.querySelector('.plato-price span');
        priceEl.textContent = new Intl.NumberFormat('es-PE', {minimumFractionDigits: 2}).format(plate.price);

        card.classList.toggle('plato-inactivo', !plate.active);
    }
}


function cleanupPlatos() {
    platosInitialized = false;
}

function initializePlatos() {
    initPlatosTabEvents();
    initPlatoCardToggleEvents();
    initPlatoModalEvents();
    platosInitialized = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        if (!platosInitialized) {
            initializePlatos();
        }
    });
} else {
    if (!platosInitialized) {
        initializePlatos();
    }
}

function initPlatoModalEvents() {
    const closeBtn = document.getElementById('closeUpdatePlateModal');
    const cancelBtn = document.getElementById('cancelUpdate');
    const modal = document.getElementById('updatePlateModal');
    const form = document.getElementById('updatePlateForm');

    if (!closeBtn || !cancelBtn || !modal || !form) return;

    if (closeBtn._closeHandler) {
        closeBtn.removeEventListener('click', closeBtn._closeHandler);
    }
    if (cancelBtn._cancelHandler) {
        cancelBtn.removeEventListener('click', cancelBtn._cancelHandler);
    }
    if (modal._modalClickHandler) {
        modal.removeEventListener('click', modal._modalClickHandler);
    }
    if (form._submitHandler) {
        form.removeEventListener('submit', form._submitHandler);
    }

    closeBtn._closeHandler = closeUpdatePlateModal;
    closeBtn.addEventListener('click', closeBtn._closeHandler);

    cancelBtn._cancelHandler = closeUpdatePlateModal;
    cancelBtn.addEventListener('click', cancelBtn._cancelHandler);

    form._submitHandler = function (event) {
        event.preventDefault();
        savePlateUpdate();
    };
    form.addEventListener('submit', form._submitHandler);
}

function validateForm(){
    clearAllErrors();

    const precio = parseFloat(document.getElementById('platePrice').value) || 0;

    if (precio < 0){
        showFieldError('platePriceError', 'El precio no puede ser negativo.');
        return false;
    }

    const decimalPart = precio.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2){
        showFieldError('platePriceError', 'El precio no puede tener más de dos decimales.');
        return false;
    }

    if (precio > 99.99){
        showFieldError('platePriceError', 'El precio no puede ser mayor a 99.99.');
        return false;
    }

    return true;
}


function savePlateUpdate() {
    if (!validateForm()) {
        return;
    }

    const form = document.getElementById('updatePlateForm');
    const plateId = form.getAttribute('data-plate-id');
    const formData = new FormData(form);

    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64Image = e.target.result.split(',')[1]; // Remove data:image/... prefix
            formData.set('imageBase64', base64Image);
            formData.delete('image');
            submitPlateUpdate(plateId, formData);
        };
        reader.readAsDataURL(imageFile);
    } else {
        const existingImage = document.querySelector(`.plato-card[data-plate-id="${plateId}"]`).getAttribute('data-image-base64') || '';
        formData.set('imageBase64', existingImage);
        formData.delete('image');
        submitPlateUpdate(plateId, formData);
    }
}

function submitPlateUpdate(plateId, formData) {
    const data = {
        id: plateId,
        price: parseFloat(formData.get('price')),
        imageBase64: formData.get('imageBase64'),
        active: formData.get('active') === 'on'
    };

    // Construir body form-urlencoded, omitiendo imageBase64 si es nulo/''
    let body = `id=${encodeURIComponent(data.id)}&price=${encodeURIComponent(data.price)}&active=${encodeURIComponent(data.active)}`;
    if (data.imageBase64 && String(data.imageBase64).trim() !== '') {
        body += `&imageBase64=${encodeURIComponent(data.imageBase64)}`;
    }

    fetch('/dashboard/plate/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
        .then(response => response.text())
        .then(result => {
            if (result === 'OK') {
                closeUpdatePlateModal();
            } else {
                alert(result);
            }
        })
        .catch(() => {
            alert('Error de red');
        });
}
