let cajaInitialized = false;
let cajaOrders = [];
let cajaRefreshInterval = null;

/**
 * Inicializa los eventos y carga inicial del módulo de Caja
 */
function initCajaTabEvents() {
    // Inicializar eventos del modal de confirmación
    const closeModal = document.getElementById('closeConfirmModal');
    const cancelBtn = document.getElementById('cancelConfirmAction');
    const confirmBtn = document.getElementById('confirmActionButton');
    
    if (closeModal) closeModal.addEventListener('click', closeConfirmModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeConfirmModal);
    if (confirmBtn) confirmBtn.addEventListener('click', executeCajaAction);
    
    // Cargar pedidos inicialmente
    loadCajaOrders();
    
    // Configurar recarga automática cada 30 segundos
    if (cajaRefreshInterval) {
        clearInterval(cajaRefreshInterval);
    }
    cajaRefreshInterval = setInterval(loadCajaOrders, 30000);
    
    cajaInitialized = true;
}

/**
 * Carga los pedidos pendientes de pago desde el servidor
 */
function loadCajaOrders() {
    const container = document.getElementById('cajaOrdersContainer');
    if (!container) return;
    
    fetch('/dashboard/orders?status=PENDIENTE,EN_PREPARACION,LISTO')
        .then(res => {
            if (!res.ok) {
                throw new Error('Error al cargar pedidos: ' + res.status);
            }
            return res.json();
        })
        .then(orders => {
            cajaOrders = orders;
            renderCajaOrders();
        })
        .catch(err => {
            console.error('Error cargando pedidos:', err);
            container.innerHTML = '<p style="color:red;">Error al cargar pedidos. Por favor, intente nuevamente.</p>';
        });
}

/**
 * Renderiza la lista de pedidos en el contenedor
 */
function renderCajaOrders() {
    const container = document.getElementById('cajaOrdersContainer');
    if (!container) return;
    
    if (!cajaOrders || cajaOrders.length === 0) {
        container.innerHTML = '<p>No hay pedidos pendientes de pago</p>';
        return;
    }
    
    container.innerHTML = cajaOrders.map(order => createCajaOrderCard(order)).join('');
}

/**
 * Crea el HTML de una tarjeta de pedido
 * @param {Object} order - Objeto con los datos del pedido
 * @returns {string} HTML de la tarjeta
 */
function createCajaOrderCard(order) {
    const statusClass = `order-${order.status.toLowerCase().replace('_', '-')}`;
    const badgeClass = `badge-${order.status.toLowerCase().replace('_', '-')}`;
    const statusText = order.status.replace('_', ' ');
    
    // Generar HTML de items
    const itemsHtml = (order.items || []).map(item => `
        <li>${item.quantity}x ${item.plate.name} - S/ ${item.priceUnit.toFixed(2)}
            ${item.notes ? `<br><small style="color:#666;">Nota: ${item.notes}</small>` : ''}
        </li>
    `).join('');
    
    // Botón de pagar solo visible si el estado es LISTO
    const pagarButton = order.status === 'LISTO' ? `
        <button class="btn-pagar" onclick="confirmCajaAction(${order.id}, 'PAGADO')">
            Marcar como Pagado
        </button>
    ` : '';
    
    return `
        <div class="order-card ${statusClass}">
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <strong>Pedido #${order.id}</strong>
                    <span class="order-status-badge ${badgeClass}">${statusText}</span>
                    <div style="margin-top:4px; color:#666;">Mesa: ${order.tableNumber}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.9em; color:#666;">${order.orderDate || order.dateAndTimeOrder || ''}</div>
                </div>
            </div>
            <div style="margin-top:8px;">
                <strong>Items:</strong>
                <ul style="margin:4px 0; padding-left:20px;">
                    ${itemsHtml}
                </ul>
            </div>
            <div class="order-total">
                Total: S/ ${(order.priceTotal || order.totalPrice || 0).toFixed(2)}
            </div>
            <div class="order-actions">
                ${pagarButton}
                <button class="btn-cancelar" onclick="confirmCajaAction(${order.id}, 'CANCELADO')">
                    Cancelar Pedido
                </button>
            </div>
        </div>
    `;
}

/**
 * Abre el modal de confirmación para una acción de caja
 * @param {number} orderId - ID del pedido
 * @param {string} action - Acción a realizar (PAGADO o CANCELADO)
 */
function confirmCajaAction(orderId, action) {
    const order = cajaOrders.find(o => o.id === orderId);
    if (!order) {
        alert('No se encontró el pedido');
        return;
    }
    
    // Validación: solo se puede marcar como PAGADO si está en estado LISTO
    if (action === 'PAGADO' && order.status !== 'LISTO') {
        alert('Solo se pueden marcar como pagados los pedidos en estado LISTO');
        return;
    }
    
    document.getElementById('modalCajaOrderId').value = orderId;
    document.getElementById('modalCajaAction').value = action;
    
    const actionText = action === 'PAGADO' ? 'marcar como pagado' : 'cancelar';
    const totalPrice = order.priceTotal || order.totalPrice || 0;
    const message = `¿Está seguro que desea ${actionText} el pedido #${orderId} de la mesa ${order.tableNumber}?<br><strong>Total: S/ ${totalPrice.toFixed(2)}</strong>`;
    
    document.getElementById('confirmActionTitle').textContent = action === 'PAGADO' ? 'Confirmar Pago' : 'Confirmar Cancelación';
    document.getElementById('confirmActionMessage').innerHTML = message;
    document.getElementById('confirmCajaActionModal').style.display = 'flex';
}

/**
 * Ejecuta la acción confirmada (pagar o cancelar pedido)
 */
function executeCajaAction() {
    const orderId = document.getElementById('modalCajaOrderId').value;
    const action = document.getElementById('modalCajaAction').value;
    
    if (!orderId || !action) {
        alert('Datos incompletos');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmActionButton');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Procesando...';
    
    // Preparar datos para enviar
    const requestData = {
        orderId: parseInt(orderId),
        status: action
    };
    
    fetch('/dashboard/orders/caja/change-status', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => {
                throw new Error(text || 'Error al cambiar estado del pedido');
            });
        }
        return res.json();
    })
    .then(() => {
        closeConfirmModal();
        loadCajaOrders();
        const successMessage = action === 'PAGADO' ? 'Pedido marcado como pagado exitosamente' : 'Pedido cancelado exitosamente';
        showCajaMessage(successMessage, 'success');
    })
    .catch(err => {
        console.error('Error al cambiar estado:', err);
        showCajaMessage('Error: ' + err.message, 'error');
    })
    .finally(() => {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar';
    });
}

/**
 * Cierra el modal de confirmación
 */
function closeConfirmModal() {
    const modal = document.getElementById('confirmCajaActionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Muestra un mensaje al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error, warning)
 */
function showCajaMessage(message, type = 'info') {
    // Intentar usar el sistema de toast si existe
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        // Fallback a alert
        alert(message);
    }
}

/**
 * Limpia los recursos del módulo de Caja
 */
function cleanupCaja() {
    if (cajaRefreshInterval) {
        clearInterval(cajaRefreshInterval);
        cajaRefreshInterval = null;
    }
    cajaInitialized = false;
}

/**
 * Inicializa el módulo de Caja
 */
function initializeCaja() {
    if (!cajaInitialized) {
        initCajaTabEvents();
    }
}

// Exponer funciones globales necesarias
window.confirmCajaAction = confirmCajaAction;

// Inicialización automática cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!cajaInitialized) {
            initializeCaja();
        }
    });
} else {
    if (!cajaInitialized) {
        initializeCaja();
    }
}