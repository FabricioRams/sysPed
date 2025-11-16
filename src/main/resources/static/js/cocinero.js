let cocineroInitialized = false;

function initCocineroTabEvents() {
    const closeModal = document.getElementById('closeChangeOrderModal');
    const cancelBtn = document.getElementById('cancelChangeOrder');
    if (closeModal) closeModal.addEventListener('click', closeChangeOrderModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeChangeOrderModal);

    refreshOrders(false);

    websocketManager.connect(() => {
        websocketManager.subscribe('/topic/order-updates', updateOrderView);
    });
    cocineroInitialized = true;
}

function updateOrderView(orderDto) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    const existingCard = document.getElementById(`order-card-${orderDto.id}`);

    if (orderDto.status !== 'PENDIENTE' && orderDto.status !== 'EN_PREPARACION') {
        if (existingCard) {
            existingCard.remove();
        }
        return;
    }

    const cardHtml = createOrderCard(orderDto);

    if (existingCard) {
        existingCard.outerHTML = cardHtml;
    } else {
        container.insertAdjacentHTML('beforeend', cardHtml);
    }
    
    const newCard = document.getElementById(`order-card-${orderDto.id}`);
    const btn = newCard.querySelector('.change-status-btn');
    if(btn){
        btn.addEventListener('click', () => openChangeOrderModal(orderDto));
    }
}

function closeChangeOrderModal() {
    const overlay = document.getElementById('changeOrderStatusModal');
    if (overlay) overlay.style.display = 'none';
}

function openChangeOrderModal(order) {
    const overlay = document.getElementById('changeOrderStatusModal');
    if (!overlay) return;
    fetch(`/dashboard/orders/${order.id}`)
        .then(resp => {
            if (!resp.ok) throw new Error('No se pudo obtener el pedido ' + order.id);
            return resp.json();
        })
        .then(latest => {
            document.getElementById('modalOrderId').value = latest.id;
            document.getElementById('modalOrderInfo').textContent = `Pedido #${latest.id} - Mesa ${latest.tableNumber} - Estado: ${latest.status}`;
            const container = document.getElementById('modalStatusButtons');
            container.innerHTML = '';
            const allowed = getAllowedStatusesForOrder(latest.status);
            if (!allowed || allowed.length === 0) {
                const p = document.createElement('p');
                p.textContent = 'No hay acciones disponibles para este estado.';
                container.appendChild(p);
            } else {
                allowed.forEach(s => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-primary status-change-btn';
                    btn.textContent = s;
                    btn.dataset.target = s;
                    btn.addEventListener('click', () => changeOrderStatus(latest.id, s));
                    container.appendChild(btn);
                });
            }
            overlay.style.display = 'flex';
        })
        .catch(err => {
            alert('No se pudo cargar el pedido: ' + err.message);
        });
}

function getAllowedStatusesForOrder(current) {
    switch (current) {
        case 'PENDIENTE': return ['EN_PREPARACION','CANCELADO'];
        case 'EN_PREPARACION': return ['LISTO','CANCELADO'];
        case 'LISTO': return ['PAGADO'];
        default: return [];
    }
}

function changeOrderStatus(orderId, newStatus) {
    fetch(`/dashboard/orders/${orderId}/status`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({status: newStatus})
    }).then(async resp => {
        const text = await resp.text();
        if (!resp.ok) {
            const message = text && text.trim() ? text : ('Error: ' + resp.status);
            throw new Error(message);
        }
        if (!text || !text.trim()) {
            return {};
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            return {};
        }
    }).then(updated => {
        closeChangeOrderModal();
        refreshOrders(true);
    }).catch(err => { alert('No se pudo actualizar: ' + err.message); });
}

function createOrderCard(o) {
    let estadoBadge = '';
    if (o.status === 'PENDIENTE') {
        estadoBadge = '<span class="order-status-badge badge-pendiente">Pendiente</span>';
    } else if (o.status === 'EN_PREPARACION') {
        estadoBadge = '<span class="order-status-badge badge-en-preparacion">En preparación</span>';
    } else {
        estadoBadge = `<span class="order-status-badge">${o.status}</span>`;
    }

    const itemsHtml = (o.items || []).map(i => `<li>${i.quantity} x ${i.plate.name} (${i.notes || ''})</li>`).join('');

    return `
        <div class="order-card ${o.status === 'PENDIENTE' ? 'order-pendiente' : ''} ${o.status === 'EN_PREPARACION' ? 'order-en-preparacion' : ''}" id="order-card-${o.id}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong>#${o.id}</strong> - Mesa ${o.tableNumber} - <em>${o.dateAndTimeOrder}</em></div>
                <div>${estadoBadge}</div>
            </div>
            <div style="margin-top:8px;">Items:</div>
            <ul>${itemsHtml}</ul>
            <div style="margin-top:8px;">
                <button class="btn btn-secondary change-status-btn">Cambiar estado</button>
            </div>
        </div>
    `;
}

function renderOrders(list) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    if (!list || list.length === 0) {
        container.innerHTML = '<p>No hay pedidos.</p>';
        return;
    }
    container.innerHTML = list.map(createOrderCard).join('');
    
    list.forEach(o => {
        const card = document.getElementById(`order-card-${o.id}`);
        const btn = card.querySelector('.change-status-btn');
        if(btn){
            btn.addEventListener('click', () => openChangeOrderModal(o));
        }
    });
}

function refreshOrders(force) {
    const url = `/dashboard/orders?status=${encodeURIComponent('PENDIENTE,EN_PREPARACION')}`;
    fetch(url).then(resp => {
        if (!resp.ok) throw new Error('No se pudo obtener pedidos');
        return resp.json();
    }).then(list => renderOrders(list)).catch(err => {
        document.getElementById('ordersContainer').innerHTML = '<p>Error al cargar pedidos.</p>';
    });
}

function cleanupCocinero() {
    websocketManager.unsubscribe('/topic/order-updates');
    cocineroInitialized = false;
}

function initializeCocinero() {
    if (!cocineroInitialized) initCocineroTabEvents();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!cocineroInitialized) initializeCocinero();
    });
} else {
    if (!cocineroInitialized) initializeCocinero();
}
