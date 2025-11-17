let cajaInitialized = false;
let cajaOrders = [];
let cajaRefreshInterval = null;
let currentPaymentOrder = null;

function initCajaTabEvents() {
    // Event listeners para modal de cancelación
    const closeCancelModal = document.getElementById('closeCancelModal');
    const cancelCancelBtn = document.getElementById('cancelCancelAction');
    const confirmCancelBtn = document.getElementById('confirmCancelAction');
    
    if (closeCancelModal) closeCancelModal.addEventListener('click', closeCancelModal);
    if (cancelCancelBtn) cancelCancelBtn.addEventListener('click', closeCancelModal);
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', executeCancelOrder);
    
    // Event listeners para modal de pago
    const closePaymentModalBtn = document.getElementById('closePaymentModal');
    const cancelPaymentBtn = document.getElementById('cancelPayment');
    const confirmPaymentBtn = document.getElementById('confirmPayment');
    
    if (closePaymentModalBtn) closePaymentModalBtn.addEventListener('click', closePaymentModal);
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closePaymentModal);
    if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', confirmPayment);
    
    // Event listener para cambio de tipo de comprobante
    const receiptTypeBoleta = document.getElementById('receiptTypeBoleta');
    const receiptTypeFactura = document.getElementById('receiptTypeFactura');
    
    if (receiptTypeBoleta) {
        receiptTypeBoleta.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('boletaFields').style.display = 'block';
                document.getElementById('facturaFields').style.display = 'none';
                clearAllErrors();
            }
        });
    }
    
    if (receiptTypeFactura) {
        receiptTypeFactura.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('boletaFields').style.display = 'none';
                document.getElementById('facturaFields').style.display = 'block';
                clearAllErrors();
            }
        });
    }
    
    // Event listener para actualizar resumen en tiempo real
    const discountInput = document.getElementById('paymentDiscount');
    if (discountInput) {
        discountInput.addEventListener('input', updatePaymentSummary);
    }
    
    // Event listeners para modal de éxito
    const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
    const viewReceiptBtn = document.getElementById('viewReceipt');
    const printReceiptBtn = document.getElementById('printReceipt');
    
    if (closeSuccessModalBtn) closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
    if (viewReceiptBtn) viewReceiptBtn.addEventListener('click', viewReceipt);
    if (printReceiptBtn) printReceiptBtn.addEventListener('click', printReceipt);
    
    loadCajaOrders();
    
    if (cajaRefreshInterval) {
        clearInterval(cajaRefreshInterval);
    }
    cajaRefreshInterval = setInterval(loadCajaOrders, 30000);
    
    cajaInitialized = true;
}

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

function renderCajaOrders() {
    const container = document.getElementById('cajaOrdersContainer');
    if (!container) return;
    
    if (!cajaOrders || cajaOrders.length === 0) {
        container.innerHTML = '<p>No hay pedidos pendientes de pago</p>';
        return;
    }
    
    container.innerHTML = cajaOrders.map(order => createCajaOrderCard(order)).join('');
}

function createCajaOrderCard(order) {
    const statusClass = `order-${order.status.toLowerCase().replace('_', '-')}`;
    const badgeClass = `badge-${order.status.toLowerCase().replace('_', '-')}`;
    const statusText = order.status.replace('_', ' ');
    
    const itemsHtml = (order.items || []).map(item => `
        <li>${item.quantity}x ${item.plate.name} - S/ ${item.priceUnit.toFixed(2)}
            ${item.notes ? `<br><small style="color:#666;">Nota: ${item.notes}</small>` : ''}
        </li>
    `).join('');
    
    const pagarButton = order.status === 'LISTO' ? `
        <button class="btn-pagar" onclick="openPaymentModal(${order.id})">
            Pagar
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
                <button class="btn-cancelar" onclick="confirmCancelOrder(${order.id})">
                    Cancelar Pedido
                </button>
            </div>
        </div>
    `;
}

function openPaymentModal(orderId) {
    const order = cajaOrders.find(o => o.id === orderId);
    if (!order) {
        alert('No se encontró el pedido');
        return;
    }
    
    if (order.status !== 'LISTO') {
        alert('Solo se pueden procesar pagos de pedidos en estado LISTO');
        return;
    }
    
    currentPaymentOrder = order;
    
    // Establecer valores iniciales
    document.getElementById('paymentOrderId').value = orderId;
    document.getElementById('paymentTableNumber').textContent = order.tableNumber;
    document.getElementById('paymentOrderTotal').textContent = (order.priceTotal || order.totalPrice || 0).toFixed(2);
    
    resetPaymentForm();
    updatePaymentSummary();
    
    document.getElementById('paymentModal').style.display = 'flex';
}

function resetPaymentForm() {
    // Seleccionar radio button BOLETA
    document.getElementById('receiptTypeBoleta').checked = true;
    document.getElementById('receiptTypeFactura').checked = false;
    
    // Limpiar todos los campos
    document.getElementById('customerDni').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerRuc').value = '';
    document.getElementById('customerRazonSocial').value = '';
    document.getElementById('paymentDiscount').value = '0';
    
    // Mostrar campos de boleta, ocultar campos de factura
    document.getElementById('boletaFields').style.display = 'block';
    document.getElementById('facturaFields').style.display = 'none';
    
    clearAllErrors();
}

function updatePaymentSummary() {
    if (!currentPaymentOrder) return;
    
    const totalPedido = currentPaymentOrder.priceTotal || currentPaymentOrder.totalPrice || 0;
    const descuento = parseFloat(document.getElementById('paymentDiscount').value) || 0;
    
    const totalConDescuento = totalPedido - descuento;
    const subtotal = totalConDescuento / 1.18;
    const igv = totalConDescuento - subtotal;
    
    document.getElementById('summarySubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('summaryIgv').textContent = igv.toFixed(2);
    document.getElementById('summaryDiscount').textContent = descuento.toFixed(2);
    document.getElementById('summaryTotal').textContent = totalConDescuento.toFixed(2);
}

function validatePaymentForm() {
    clearAllErrors();
    
    const descuento = parseFloat(document.getElementById('paymentDiscount').value) || 0;
    const totalPedido = currentPaymentOrder.priceTotal || currentPaymentOrder.totalPrice || 0;
    
    // Validar descuento
    if (descuento < 0) {
        showFieldError('discountError', 'El descuento no puede ser negativo');
        return false;
    }
    
    if (descuento > totalPedido) {
        showFieldError('discountError', 'El descuento no puede ser mayor que el total del pedido');
        return false;
    }
    
    const decimalPart = descuento.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
        showFieldError('discountError', 'El descuento debe tener máximo 2 decimales');
        return false;
    }
    
    const receiptType = document.querySelector('input[name="receiptType"]:checked').value;
    
    if (receiptType === 'FACTURA') {
        const ruc = document.getElementById('customerRuc').value.trim();
        const razonSocial = document.getElementById('customerRazonSocial').value.trim();
        
        if (!ruc) {
            showFieldError('rucError', 'El RUC es obligatorio para facturas');
            return false;
        }
        
        if (!/^\d{11}$/.test(ruc)) {
            showFieldError('rucError', 'El RUC debe tener exactamente 11 dígitos');
            return false;
        }
        
        if (!razonSocial) {
            showFieldError('razonSocialError', 'La razón social es obligatoria para facturas');
            return false;
        }
        
        if (razonSocial.length > 120) {
            showFieldError('razonSocialError', 'La razón social no puede exceder 120 caracteres');
            return false;
        }
    } else if (receiptType === 'BOLETA') {
        const dni = document.getElementById('customerDni').value.trim();
        const nombre = document.getElementById('customerName').value.trim();
        
        if (dni && !/^\d{8}$/.test(dni)) {
            showFieldError('dniError', 'El DNI debe tener exactamente 8 dígitos');
            return false;
        }
        
        if (dni && !nombre) {
            showFieldError('nameError', 'Si proporciona DNI, el nombre es obligatorio');
            return false;
        }
        
        if (nombre && nombre.length > 120) {
            showFieldError('nameError', 'El nombre no puede exceder 120 caracteres');
            return false;
        }
    }
    
    return true;
}

function confirmPayment() {
    if (!validatePaymentForm()) {
        return;
    }
    
    const orderId = parseInt(document.getElementById('paymentOrderId').value);
    const receiptType = document.querySelector('input[name="receiptType"]:checked').value;
    const descuento = parseFloat(document.getElementById('paymentDiscount').value) || 0;
    
    let requestData = {
        receiptType: receiptType,
        discount: descuento
    };
    
    if (receiptType === 'FACTURA') {
        requestData.ruc = document.getElementById('customerRuc').value.trim();
        requestData.customerName = document.getElementById('customerRazonSocial').value.trim();
    } else if (receiptType === 'BOLETA') {
        const dni = document.getElementById('customerDni').value.trim();
        const nombre = document.getElementById('customerName').value.trim();
        
        if (dni) {
            requestData.dni = dni;
        }
        if (nombre) {
            requestData.customerName = nombre;
        }
    }
    
    const confirmBtn = document.getElementById('confirmPayment');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Procesando...';
    
    fetch(`/dashboard/orders/${orderId}/receipt`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => {
                throw new Error(text || 'Error al procesar el pago');
            });
        }
        return res.json();
    })
    .then(receipt => {
        closePaymentModal();
        showPaymentSuccess(receipt);
        loadCajaOrders();
    })
    .catch(err => {
        console.error('Error al procesar pago:', err);
        showCajaMessage('Error: ' + err.message, 'error');
    })
    .finally(() => {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar Pago';
    });
}

function showPaymentSuccess(receipt) {
    document.getElementById('successOrderId').textContent = receipt.orderId;
    document.getElementById('successReceiptId').textContent = receipt.receiptId;
    document.getElementById('successReceiptType').textContent = receipt.receiptType;
    document.getElementById('successCustomerName').textContent = receipt.customerName || 'Cliente General';
    document.getElementById('successTotal').textContent = receipt.total.toFixed(2);
    
    document.getElementById('paymentSuccessModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    currentPaymentOrder = null;
}

function closeSuccessModal() {
    document.getElementById('paymentSuccessModal').style.display = 'none';
}

function viewReceipt() {
    alert('Funcionalidad en desarrollo');
}

function printReceipt() {
    alert('Funcionalidad en desarrollo');
}

function confirmCancelOrder(orderId) {
    const order = cajaOrders.find(o => o.id === orderId);
    if (!order) {
        alert('No se encontró el pedido');
        return;
    }
    
    document.getElementById('cancelOrderId').value = orderId;
    
    const totalPrice = order.priceTotal || order.totalPrice || 0;
    const message = `¿Está seguro que desea cancelar el pedido #${orderId} de la mesa ${order.tableNumber}?<br><strong>Total: S/ ${totalPrice.toFixed(2)}</strong>`;
    
    document.getElementById('cancelMessage').innerHTML = message;
    document.getElementById('confirmCancelModal').style.display = 'flex';
}

function executeCancelOrder() {
    const orderId = document.getElementById('cancelOrderId').value;
    
    if (!orderId) {
        alert('Datos incompletos');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmCancelAction');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Procesando...';
    
    const requestData = {
        orderId: parseInt(orderId),
        status: 'CANCELADO'
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
                throw new Error(text || 'Error al cancelar el pedido');
            });
        }
        return res.json();
    })
    .then(() => {
        closeCancelModal();
        loadCajaOrders();
        showCajaMessage('Pedido cancelado exitosamente', 'success');
    })
    .catch(err => {
        console.error('Error al cancelar pedido:', err);
        showCajaMessage('Error: ' + err.message, 'error');
    })
    .finally(() => {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar';
    });
}

function closeCancelModal() {
    document.getElementById('confirmCancelModal').style.display = 'none';
}

function showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Agregar clase de error al input correspondiente
        const inputId = errorId.replace('Error', '');
        const inputElement = document.getElementById(inputId) || 
                           document.getElementById('customer' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const inputElements = document.querySelectorAll('.input-error');
    inputElements.forEach(el => {
        el.classList.remove('input-error');
    });
}

function showCajaMessage(message, type = 'info') {
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        alert(message);
    }
}

function cleanupCaja() {
    if (cajaRefreshInterval) {
        clearInterval(cajaRefreshInterval);
        cajaRefreshInterval = null;
    }
    cajaInitialized = false;
}

function initializeCaja() {
    if (!cajaInitialized) {
        initCajaTabEvents();
    }
}

// Exponer funciones globalmente
window.openPaymentModal = openPaymentModal;
window.confirmCancelOrder = confirmCancelOrder;

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