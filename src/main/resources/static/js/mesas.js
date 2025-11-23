let mesasInitialized = false;

function updateTableInView(tableDTO) {
    const mesaElement = document.querySelector(`.mesa[data-numero="${tableDTO.number}"]`);
    if (mesaElement) {
        actualizarVistaMesa(mesaElement, tableDTO.status);
        actualizarResumen();
    }
}

function initMesaClickEvents() {
    const mesasGrid = document.getElementById('mesasGrid');
    if (!mesasGrid) return;

    if (mesasGrid._mesasClickHandler) {
        mesasGrid.removeEventListener('click', mesasGrid._mesasClickHandler);
    }

    mesasGrid._mesasClickHandler = function (e) {
        const mesa = e.target.closest('.mesa');
        const crearPedidoBtn = e.target.closest('.btn-crear-pedido');

        if (crearPedidoBtn && mesa) {
            const tableNumber = mesa.getAttribute('data-numero');
            openOrderModal(parseInt(tableNumber));
        } else if (mesa && !crearPedidoBtn) {
            openTableStatusModal(mesa);
        }
    };

    mesasGrid.addEventListener('click', mesasGrid._mesasClickHandler);
}

function sendTableUpdate(tableNumber, newStatus) {
    const url = `/dashboard/tables/${tableNumber}/status`;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    }).then(resp => {
        if (!resp.ok) {
            return resp.text().then(text => {
                throw new Error(text || 'Error al actualizar estado')
            })
        }
        closeTableStatusModal();
    }).catch(err => {
        showToast('Error al cambiar estado: ' + err.message);
    });
}

function actualizarResumen() {
    const mesasEls = Array.from(document.querySelectorAll('.mesa'));
    const countV = mesasEls.filter(el => el.classList.contains('mesa-verde')).length;
    const countA = mesasEls.filter(el => el.classList.contains('mesa-azul')).length;
    const countAm = mesasEls.filter(el => el.classList.contains('mesa-amarillo')).length;
    const countR = mesasEls.filter(el => el.classList.contains('mesa-rojo')).length;

    document.querySelectorAll('.count-verde').forEach(el => el.textContent = countV);
    document.querySelectorAll('.count-azul').forEach(el => el.textContent = countA);
    document.querySelectorAll('.count-amarillo').forEach(el => el.textContent = countAm);
    document.querySelectorAll('.count-rojo').forEach(el => el.textContent = countR);
}

function initMesasFromDOM() {
    document.querySelectorAll('.mesa').forEach(el => {
        if (!el.dataset.estado) el.dataset.estado = 'gris';

        const statusEnum = el.getAttribute('data-status-enum');

        if (statusEnum) {
            actualizarVistaMesa(el, statusEnum);
        } else {
            actualizarVistaMesa(el, 'FUERA_DE_SERVICIO');
        }
    });
    actualizarResumen();
}

function actualizarVistaMesa(mesaElement, statusEnum) {
    mesaElement.classList.remove('mesa-gris', 'mesa-verde', 'mesa-azul', 'mesa-amarillo', 'mesa-rojo');

    let claseColor = 'mesa-gris';
    let textoEstado = 'Sin estado';

    switch (statusEnum) {
        case 'DISPONIBLE':
            claseColor = 'mesa-verde';
            textoEstado = 'Mesa Libre';
            break;
        case 'ESPERANDO_PEDIDO':
            claseColor = 'mesa-azul';
            textoEstado = 'Esperando Pedido';
            break;
        case 'FALTA_ATENCION':
            claseColor = 'mesa-amarillo';
            textoEstado = 'Falta Atención';
            break;
        case 'PEDIDO_ENTREGADO':
            claseColor = 'mesa-rojo';
            textoEstado = 'Pedido Entregado';
            break;
        case 'FUERA_DE_SERVICIO':
        case 'OCUPADO':
        case 'RESERVADO':
            claseColor = 'mesa-gris';
            textoEstado = 'Sin estado';
            break;
    }

    mesaElement.classList.add(claseColor);
    const estadoEl = mesaElement.querySelector('.mesa-estado');
    if (estadoEl) estadoEl.textContent = textoEstado;
    mesaElement.setAttribute('data-status-enum', statusEnum);
}

function getManuallyAllowedStatusesForTable(currentStatus) {
    switch (currentStatus) {
        case 'DISPONIBLE':
            return new Set(['FUERA_DE_SERVICIO']);
        case 'ESPERANDO_PEDIDO':
            return new Set(['FALTA_ATENCION', 'PEDIDO_ENTREGADO']);
        case 'FALTA_ATENCION':
            return new Set(['DISPONIBLE', 'PEDIDO_ENTREGADO', 'ESPERANDO_PEDIDO']);
        case 'PEDIDO_ENTREGADO':
            return new Set(['DISPONIBLE', 'FALTA_ATENCION']);
        case 'FUERA_DE_SERVICIO':
            return new Set(['DISPONIBLE']);
        default:
            return new Set();
    }
}

function openTableStatusModal(mesaElement) {
    const overlay = document.getElementById('tableStatusModal');
    if (!overlay) return;

    const tableNumber = mesaElement.getAttribute('data-numero');
    const titleNumberSpan = overlay.querySelector('.modal-title-restaurantTable-number');
    const hiddenInput = document.getElementById('modalTableNumberInput');
    const crearPedidoSection = document.getElementById('crearPedidoSection');

    if (titleNumberSpan) titleNumberSpan.textContent = tableNumber;
    if (hiddenInput) hiddenInput.value = tableNumber;

    const currentStatus = mesaElement.getAttribute('data-status-enum') || 'FUERA_DE_SERVICIO';
    overlay.querySelectorAll('.status-button').forEach(btn => {
        if (btn.dataset.status === currentStatus) {
            btn.classList.add('selected-status');
        } else {
            btn.classList.remove('selected-status');
        }
    });

    const allowedManual = getManuallyAllowedStatusesForTable(currentStatus);
    overlay.querySelectorAll('.status-button').forEach(btn => {
        const target = btn.dataset.status;
        if (!allowedManual.has(target) && target !== currentStatus) {
            btn.disabled = true;
            btn.classList.add('status-button-disabled');
            btn.title = 'Solo se puede cambiar manualmente a ciertos estados desde ' + currentStatus;
        } else {
            btn.disabled = false;
            btn.classList.remove('status-button-disabled');
            btn.title = '';
        }
    });

    if (crearPedidoSection) {
        if (currentStatus === 'DISPONIBLE' || currentStatus === 'ESPERANDO_PEDIDO') {
            crearPedidoSection.style.display = 'block';
            const btn = document.getElementById('crearPedidoBtn');
            const btnText = document.getElementById('crearPedidoBtnText');
            const svg = btn ? btn.querySelector('svg') : null;
            if (btn && btnText) {
                if (currentStatus === 'DISPONIBLE') {
                    btnText.textContent = 'Crear Pedido';
                    btn.className = 'btn btn-crear-pedido-modal';
                    if (svg) {
                        svg.innerHTML = '<path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>';
                    }
                } else {
                    btnText.textContent = 'Ver Pedido';
                    btn.className = 'btn btn-ver-pedido-modal';
                    if (svg) {
                        svg.innerHTML = '<path d="M8 4C5.8 4 4 5.8 4 8s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM2 8c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6z"/>';
                    }
                }
            }
        } else {
            crearPedidoSection.style.display = 'none';
        }
    }

    overlay.style.display = 'flex';
}

function closeTableStatusModal() {
    const overlay = document.getElementById('tableStatusModal');
    if (!overlay) return;
    overlay.style.display = 'none';

    overlay.querySelectorAll('.status-button').forEach(btn => btn.classList.remove('selected-status'));
}

function initMesaModalEvents() {
    const overlay = document.getElementById('tableStatusModal');
    if (!overlay) return;

    const closeBtn = document.getElementById('closeTableStatusModal');
    const cancelarBtn = document.getElementById('cancelarTableStatus');
    const crearPedidoBtn = document.getElementById('crearPedidoBtn');

    if (closeBtn && closeBtn._closeHandler) {
        closeBtn.removeEventListener('click', closeBtn._closeHandler);
    }
    if (cancelarBtn && cancelarBtn._cancelHandler) {
        cancelarBtn.removeEventListener('click', cancelarBtn._cancelHandler);
    }
    if (crearPedidoBtn && crearPedidoBtn._crearPedidoHandler) {
        crearPedidoBtn.removeEventListener('click', crearPedidoBtn._crearPedidoHandler);
    }
    if (overlay._overlayClickHandler) {
        overlay.removeEventListener('click', overlay._overlayClickHandler);
    }
    if (overlay._statusButtonHandler) {
        overlay.removeEventListener('click', overlay._statusButtonHandler);
    }

    if (closeBtn) {
        closeBtn._closeHandler = closeTableStatusModal;
        closeBtn.addEventListener('click', closeBtn._closeHandler);
    }

    if (cancelarBtn) {
        cancelarBtn._cancelHandler = closeTableStatusModal;
        cancelarBtn.addEventListener('click', cancelarBtn._cancelHandler);
    }

    if (crearPedidoBtn) {
        crearPedidoBtn._crearPedidoHandler = function () {
            const tableNumber = document.getElementById('modalTableNumberInput').value;
            if (tableNumber) {
                const mesaEl = document.querySelector(`.mesa[data-numero="${tableNumber}"]`);
                const currentStatus = mesaEl ? mesaEl.getAttribute('data-status-enum') : 'FUERA_DE_SERVICIO';
                closeTableStatusModal();
                if (currentStatus === 'DISPONIBLE') {
                    openOrderModal(parseInt(tableNumber));
                } else if (currentStatus === 'ESPERANDO_PEDIDO') {
                    openViewOrderModal(parseInt(tableNumber));
                }
            }
        };
        crearPedidoBtn.addEventListener('click', crearPedidoBtn._crearPedidoHandler);
    }

    overlay._statusButtonHandler = function (event) {
        const btn = event.target.closest('.status-button');
        if (btn) {
            if (btn.disabled) {
                showToast('Operación no permitida.');
                return;
            }
            const status = btn.dataset.status;
            const tableNumber = document.getElementById('modalTableNumberInput').value;
            if (tableNumber && status) {
                fetch(`/dashboard/tables/${tableNumber}/allowed-statuses`)
                    .then(resp => resp.ok ? resp.json() : Promise.reject('No se pudo validar transición'))
                    .then(allowedList => {
                        const allowedSet = new Set(allowedList);
                        const mesaEl = document.querySelector(`.mesa[data-numero="${tableNumber}"]`);
                        const current = mesaEl ? mesaEl.getAttribute('data-status-enum') || 'FUERA_DE_SERVICIO' : 'FUERA_DE_SERVICIO';
                        if (!allowedSet.has(status) && status !== current) {
                            showToast('Operación no permitida: ' + current + ' → ' + status);
                            return;
                        }
                        sendTableUpdate(tableNumber, status);
                    })
                    .catch(err => {
                        const mesaEl = document.querySelector(`.mesa[data-numero="${tableNumber}"]`);
                        const current = mesaEl ? mesaEl.getAttribute('data-status-enum') || 'FUERA_DE_SERVICIO' : 'FUERA_DE_SERVICIO';
                        const allowed = getManuallyAllowedStatusesForTable(current);
                        if (!allowed.has(status) && status !== current) {
                            showToast('Operación no permitida: ' + current + ' → ' + status);
                            return;
                        }
                        sendTableUpdate(tableNumber, status);
                    });
            }
        }
    };
    overlay.addEventListener('click', overlay._statusButtonHandler);
}



function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebarContent');

    if (toggleBtn && sidebar) {
        // Remove existing listener if any (to avoid duplicates on re-init)
        if (toggleBtn._clickHandler) {
            toggleBtn.removeEventListener('click', toggleBtn._clickHandler);
        }

        toggleBtn._clickHandler = function () {
            sidebar.classList.toggle('active');
            toggleBtn.classList.toggle('active');
            const icon = toggleBtn.querySelector('.toggle-icon');
            if (icon) {
                icon.style.transform = sidebar.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        };

        toggleBtn.addEventListener('click', toggleBtn._clickHandler);
    }
}

function initOrderModalEvents() {
    const overlay = document.getElementById('orderModal');
    if (!overlay) return;

    const closeBtn = document.getElementById('closeOrderModal');
    const cancelBtn = document.getElementById('cancelOrder');
    const submitBtn = document.getElementById('submitOrder');

    if (closeBtn && closeBtn._closeHandler) {
        closeBtn.removeEventListener('click', closeBtn._closeHandler);
    }
    if (cancelBtn && cancelBtn._cancelHandler) {
        cancelBtn.removeEventListener('click', cancelBtn._cancelHandler);
    }
    if (submitBtn && submitBtn._submitHandler) {
        submitBtn.removeEventListener('click', submitBtn._submitHandler);
    }
    if (overlay._overlayClickHandler) {
        overlay.removeEventListener('click', overlay._overlayClickHandler);
    }
    if (overlay._quantityButtonHandler) {
        overlay.removeEventListener('click', overlay._quantityButtonHandler);
    }
    if (overlay._notesInputHandler) {
        overlay.removeEventListener('input', overlay._notesInputHandler);
    }

    if (closeBtn) {
        closeBtn._closeHandler = closeOrderModal;
        closeBtn.addEventListener('click', closeBtn._closeHandler);
    }

    if (cancelBtn) {
        cancelBtn._cancelHandler = closeOrderModal;
        cancelBtn.addEventListener('click', cancelBtn._cancelHandler);
    }

    if (submitBtn) {
        submitBtn._submitHandler = submitOrder;
        submitBtn.addEventListener('click', submitBtn._submitHandler);
    }

    overlay._quantityButtonHandler = function (event) {
        const btn = event.target.closest('.btn-quantity');
        if (btn) {
            const action = btn.dataset.action;
            const plateId = parseInt(btn.dataset.plateId);
            const quantityDisplay = document.getElementById(`quantity-${plateId}`);
            const notesInput = document.getElementById(`notes-${plateId}`);
            let quantity = parseInt(quantityDisplay.textContent);

            if (action === 'increase') {
                quantity++;
            } else if (action === 'decrease' && quantity > 0) {
                quantity--;
            }

            quantityDisplay.textContent = quantity;
            const notes = notesInput.value.trim();
            addPlateToOrder(plateId, quantity, notes);
        }
    };
    overlay.addEventListener('click', overlay._quantityButtonHandler);

    overlay._notesInputHandler = function (event) {
        const input = event.target.closest('.notes-input');
        if (input) {
            const plateId = parseInt(input.id.replace('notes-', ''));
            const quantityDisplay = document.getElementById(`quantity-${plateId}`);
            const quantity = parseInt(quantityDisplay.textContent);
            const notes = input.value.trim();
            addPlateToOrder(plateId, quantity, notes);
        }
    };
    overlay.addEventListener('input', overlay._notesInputHandler);
}

function cleanupMesas() {
    if (mesasInitialized) {
        websocketManager.unsubscribe('/topic/tableStatus');
        websocketManager.unsubscribe('/topic/plate-updates');
        mesasInitialized = false;
    }
}

function handleTableStatusUpdate(update) {
    const tableId = String(update.number);
    const newStatus = update.status;
    const mesas = document.querySelectorAll(`.mesa[data-numero="${tableId}"]`);
    if (mesas.length === 0) {
        console.warn(`[WebSocket] No se encontró ninguna mesa con data-numero="${tableId}"`);
    }
    mesas.forEach(mesaElement => {
        actualizarVistaMesa(mesaElement, newStatus);
        actualizarResumen();
    });
}

function initializeMesas() {
    if (mesasInitialized) return;

    initMesasFromDOM();
    initMesaClickEvents();
    // Sidebar toggle removed
    initMesaModalEvents();
    initOrderModalEvents();
    initViewOrderModalEvents();

    websocketManager.connect(() => {
        websocketManager.subscribe('/topic/table-status', handleTableStatusUpdate);
        websocketManager.subscribe('/topic/plate-updates', updatePlateInOrderModal);
    });

    mesasInitialized = true;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        if (!mesasInitialized) {
            initializeMesas();
        }
    });
} else {
    if (!mesasInitialized) {
        initializeMesas();
    }
}

let currentOrderItems = [];
let currentTableNumber = null;
let currentOrderId = null;

function openOrderModal(tableNumber) {
    currentTableNumber = tableNumber;
    currentOrderItems = [];
    currentOrderId = null;
    document.getElementById('orderModalTableNumber').textContent = tableNumber;
    document.getElementById('orderModalTitle').textContent = 'Crear Pedido';
    document.getElementById('submitOrder').textContent = 'Crear Pedido';
    document.getElementById('orderModal').style.display = 'flex';
    loadAvailablePlates();
    updateOrderSummary();
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    currentOrderItems = [];
    currentTableNumber = null;
    currentOrderId = null;
}

function loadAvailablePlates() {
    fetch('/dashboard/orders/plates')
        .then(response => response.json())
        .then(plates => {
            const platesList = document.getElementById('platesList');
            platesList.innerHTML = '';

            plates.forEach(plate => {
                const plateDiv = document.createElement('div');
                plateDiv.className = 'plate-item';
                plateDiv.setAttribute('data-plate-id', plate.id);

                // Find existing order item for this plate
                const existingItem = currentOrderItems.find(item => item.plateId === plate.id);
                const quantity = existingItem ? existingItem.quantity : 0;
                const notes = existingItem ? existingItem.notes : '';

                plateDiv.innerHTML = `
                    <div class="plate-info">
                        <h4>${plate.name}</h4>
                        <p>${plate.description}</p>
                        <p class="plate-price" data-price="${plate.price}">S/ ${plate.price}</p>
                    </div>
                    <div class="plate-controls">
                        <button class="btn-quantity" data-action="decrease" data-plate-id="${plate.id}">-</button>
                        <span class="quantity-display" id="quantity-${plate.id}">${quantity}</span>
                        <button class="btn-quantity" data-action="increase" data-plate-id="${plate.id}">+</button>
                        <input type="text" class="notes-input" id="notes-${plate.id}" placeholder="Notas (opcional)" value="${notes}">
                    </div>
                `;
                platesList.appendChild(plateDiv);
            });
        })
        .catch(error => {
            showToast('Error al cargar los platos disponibles');
        });
}

function updatePlateInOrderModal(plate) {
    const plateItem = document.querySelector(`.plate-item[data-plate-id="${plate.id}"]`);
    if (!plateItem) return;

    const plateInfo = plateItem.querySelector('.plate-info');
    const nameEl = plateInfo.querySelector('h4');
    const descEl = plateInfo.querySelector('p:not(.plate-price)');
    const priceEl = plateInfo.querySelector('.plate-price');

    if (nameEl) nameEl.textContent = plate.name;
    if (descEl) descEl.textContent = plate.description;
    if (priceEl) {
        priceEl.textContent = `S/ ${plate.price}`;
        priceEl.setAttribute('data-price', plate.price);
    }

    const orderItem = currentOrderItems.find(item => item.plateId === plate.id);
    if (orderItem) {
        orderItem.name = plate.name;
        orderItem.price = plate.price;
        updateOrderSummary();
    }

    if (!plate.active) {
        plateItem.style.opacity = '0.5';
        plateItem.style.pointerEvents = 'none';
        const quantityDisplay = document.getElementById(`quantity-${plate.id}`);
        if (quantityDisplay && parseInt(quantityDisplay.textContent) > 0) {
            showToast(`El plato "${plate.name}" ya no está disponible`, 'warning');
        }
    } else {
        plateItem.style.opacity = '1';
        plateItem.style.pointerEvents = 'auto';
    }
}

function updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const orderTotal = document.getElementById('orderTotal');

    if (currentOrderItems.length === 0) {
        orderSummary.innerHTML = '<p>No hay items en el pedido</p>';
        orderTotal.textContent = '0.00';
        return;
    }

    let total = 0;
    orderSummary.innerHTML = currentOrderItems.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="order-item">
                <span>${item.name} x${item.quantity}</span>
                <span>S/ ${itemTotal.toFixed(2)}</span>
                ${item.notes ? `<small>Notas: ${item.notes}</small>` : ''}
            </div>
        `;
    }).join('');

    orderTotal.textContent = total.toFixed(2);
}

function addPlateToOrder(plateId, quantity, notes) {
    const plateItem = document.querySelector(`.plate-item[data-plate-id="${plateId}"]`);
    if (!plateItem) return;

    const plateInfo = plateItem.querySelector('.plate-info');
    const name = plateInfo.querySelector('h4').textContent;
    const priceEl = plateInfo.querySelector('.plate-price');
    const price = parseFloat(priceEl.getAttribute('data-price') || priceEl.textContent.replace('S/ ', ''));

    const existingItem = currentOrderItems.find(item => item.plateId === plateId);
    if (existingItem) {
        existingItem.quantity = quantity;
        existingItem.notes = notes;
        existingItem.price = price;
        existingItem.name = name;
        if (quantity === 0) {
            currentOrderItems = currentOrderItems.filter(item => item.plateId !== plateId);
        }
    } else if (quantity > 0) {
        currentOrderItems.push({
            plateId: plateId,
            name: name,
            price: price,
            quantity: quantity,
            notes: notes
        });
    }
    updateOrderSummary();
}

function submitOrder() {
    if (currentOrderItems.length === 0) {
        showToast('Debe agregar al menos un plato al pedido');
        return;
    }

    const orderData = {
        tableNumber: currentTableNumber,
        items: currentOrderItems.map(item => ({
            plateId: item.plateId,
            quantity: item.quantity,
            notes: item.notes || null
        }))
    };

    const url = currentOrderId ? `/dashboard/orders/${currentOrderId}` : '/dashboard/orders';
    const method = currentOrderId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 400) {
                return response.text().then(text => {
                    throw new Error(text || 'Datos inválidos para el pedido');
                });
            } else {
                throw new Error('Error al ' + (currentOrderId ? 'actualizar' : 'crear') + ' el pedido');
            }
        })
        .then(data => {
            showToast('Pedido ' + (currentOrderId ? 'actualizado' : 'creado') + ' exitosamente', 'success');
            closeOrderModal();
            updateTableInView({ number: currentTableNumber, status: 'ESPERANDO_PEDIDO' });
            actualizarResumen();
        })
        .catch(error => {
            showToast(error.message || 'Error al ' + (currentOrderId ? 'actualizar' : 'crear') + ' el pedido');
        });
}

function openViewOrderModal(tableNumber) {
    const modal = document.getElementById('viewOrderModal');
    const tableNumberSpan = document.getElementById('viewOrderModalTableNumber');
    const contentDiv = document.getElementById('viewOrderContent');

    if (!modal || !tableNumberSpan || !contentDiv) return;

    tableNumberSpan.textContent = tableNumber;
    contentDiv.innerHTML = '<p>Cargando pedido...</p>';
    modal.style.display = 'flex';

    fetch(`/dashboard/orders/table/${tableNumber}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 404) {
                throw new Error('No se encontró un pedido activo para esta mesa');
            } else {
                throw new Error('Error al cargar el pedido');
            }
        })
        .then(order => {
            displayOrderDetails(order, contentDiv);
        })
        .catch(error => {
            contentDiv.innerHTML = `<p class="error">${error.message}</p>`;
        });
}

function displayOrderDetails(order, contentDiv) {
    if (!order.items || !Array.isArray(order.items)) {
        contentDiv.innerHTML = '<p>No hay detalles del pedido disponibles.</p>';
        return;
    }

    const itemsHtml = order.items.map(detail => {
        const plateName = detail.plate && detail.plate.name ? detail.plate.name : 'Plato desconocido';
        return `
        <div class="order-item">
            <div class="item-header">
                <span class="item-name">${plateName}</span>
                <span class="item-quantity">x${detail.quantity}</span>
                <span class="item-price">S/ ${(Number(detail.priceUnit) * Number(detail.quantity)).toFixed(2)}</span>
            </div>
            ${detail.notes ? `<div class="item-notes">Notas: ${detail.notes}</div>` : ''}
        </div>
    `
    }).join('');

    contentDiv.innerHTML = `
        <div class="order-details">
            <div class="order-info">
                <p><strong>ID del Pedido:</strong> ${order.id}</p>
                <p><strong>Estado:</strong> ${order.status}</p>
                <p><strong>Fecha:</strong> ${new Date(order.dateAndTimeOrder).toLocaleString()}</p>
            </div>
            <div class="order-items">
                <h4>Items del Pedido:</h4>
                ${itemsHtml}
            </div>
            <div class="order-total">
                <strong>Total: S/ ${(order.totalPrice ? Number(order.totalPrice) : 0).toFixed(2)}</strong>
            </div>
            <div class="order-actions">
                <button id="editOrderBtn" class="btn btn-edit-order">Editar</button>
            </div>
        </div>
    `;
}

function closeViewOrderModal() {
    const modal = document.getElementById('viewOrderModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function initViewOrderModalEvents() {
    const modal = document.getElementById('viewOrderModal');
    if (!modal) return;

    const closeBtn = document.getElementById('closeViewOrderModal');
    const closeViewBtn = document.getElementById('closeViewOrderBtn');

    if (closeBtn && closeBtn._closeHandler) {
        closeBtn.removeEventListener('click', closeBtn._closeHandler);
    }
    if (closeViewBtn && closeViewBtn._closeHandler) {
        closeViewBtn.removeEventListener('click', closeViewBtn._closeHandler);
    }
    if (modal._overlayClickHandler) {
        modal.removeEventListener('click', modal._overlayClickHandler);
    }
    if (modal._editOrderHandler) {
        modal.removeEventListener('click', modal._editOrderHandler);
    }

    if (closeBtn) {
        closeBtn._closeHandler = closeViewOrderModal;
        closeBtn.addEventListener('click', closeBtn._closeHandler);
    }

    if (closeViewBtn) {
        closeViewBtn._closeHandler = closeViewOrderModal;
        closeViewBtn.addEventListener('click', closeViewBtn._closeHandler);
    }

    modal._editOrderHandler = function (event) {
        const editBtn = event.target.closest('#editOrderBtn');
        if (editBtn) {
            const tableNumberSpan = document.getElementById('viewOrderModalTableNumber');
            if (tableNumberSpan) {
                const tableNumber = parseInt(tableNumberSpan.textContent);
                openEditOrderModal(tableNumber);
            }
        }
    };
    modal.addEventListener('click', modal._editOrderHandler);

    modal._overlayClickHandler = function (event) {
        if (event.target === modal) {
            closeViewOrderModal();
        }
    };
    modal.addEventListener('click', modal._overlayClickHandler);
}

function openEditOrderModal(tableNumber) {
    closeViewOrderModal();
    currentTableNumber = tableNumber;
    currentOrderItems = [];
    currentOrderId = null;

    fetch(`/dashboard/orders/table/${tableNumber}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('No se pudo cargar el pedido');
            }
        })
        .then(order => {
            currentOrderId = order.id;
            order.items.forEach(detail => {
                currentOrderItems.push({
                    plateId: detail.plate.id,
                    name: detail.plate.name,
                    price: Number(detail.priceUnit),
                    quantity: detail.quantity,
                    notes: detail.notes || ''
                });
            });
            const tableNumberEl = document.getElementById('orderModalTableNumber');
            const titleEl = document.getElementById('orderModalTitle');
            const submitEl = document.getElementById('submitOrder');
            const modalEl = document.getElementById('orderModal');
            if (tableNumberEl) tableNumberEl.textContent = tableNumber;
            if (titleEl) titleEl.textContent = 'Editar Pedido';
            if (submitEl) submitEl.textContent = 'Actualizar Pedido';
            if (modalEl) modalEl.style.display = 'flex';
            loadAvailablePlates();
            updateOrderSummary();
        })
        .catch(error => {
            showToast(error.message || 'Error al cargar el pedido para editar');
        });
}

function showToast(message, type = 'error', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        alert(message);
        return;
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, duration);
}
