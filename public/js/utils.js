/**
 * Utility functions for JSON to Spring Entity Converter
 */

/**
 * Convert string to camelCase
 * @param {string} str - Input string
 * @returns {string} camelCase string
 */
function toCamelCase(str) {
    return str
        .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
        .replace(/^./, char => char.toLowerCase());
}

/**
 * Convert string to PascalCase
 * @param {string} str - Input string
 * @returns {string} PascalCase string
 */
function toPascalCase(str) {
    const camelCase = toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Convert string to snake_case
 * @param {string} str - Input string
 * @returns {string} snake_case string
 */
function toSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}

/**
 * Simple singularization of a string
 * @param {string} str - Input string
 * @returns {string} Singularized string
 */
function singularize(str) {
    if (str.endsWith('ies')) {
        return str.slice(0, -3) + 'y';
    }
    if (str.endsWith('es')) {
        return str.slice(0, -2);
    }
    if (str.endsWith('s') && !str.endsWith('ss')) {
        return str.slice(0, -1);
    }
    return str;
}

/**
 * Escape HTML special characters
 * @param {string} text - Input text
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show status message to user
 * @param {string} message - Status message
 * @param {string} type - Message type ('success' or 'error')
 */
function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');

    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 3000);
}

/**
 * Update statistics display
 * @param {number} classCount - Number of classes generated
 * @param {number} fieldCount - Number of fields generated
 * @param {number} annotationCount - Number of annotations generated
 */
function updateStats(classCount, fieldCount, annotationCount) {
    document.getElementById('stats').classList.remove('hidden');
    document.getElementById('class-count').textContent = classCount;
    document.getElementById('field-count').textContent = fieldCount;
    document.getElementById('annotation-count').textContent = annotationCount;
}

/**
 * Check if string is in snake_case format
 * @param {string} str - Input string
 * @returns {boolean} True if string is in snake_case
 */
function isSnakeCase(str) {
    // snake_case: lowercase letters, numbers, and underscores only
    // Must not contain uppercase letters or hyphens
    return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(str);
}

/**
 * Set current year in footer
 */
function setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}
