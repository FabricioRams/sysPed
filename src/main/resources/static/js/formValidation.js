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

function showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        const inputId = errorId.replace('Error', '');
        const inputElement = document.getElementById(inputId) ||
            document.getElementById('customer' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
        if (inputElement) {
            inputElement.classList.add('input-error');
        }
    }
}

