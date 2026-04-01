/**
 * Local storage operations for JSON to Spring Entity Converter
 */

/**
 * Save JSON to Spring Entity data to localStorage
 * @param {string} input - JSON input value
 * @param {Object} options - Conversion options
 * @param {string} packageName - Package name
 * @param {string} className - Class name
 */
function saveToLocalStorage(input, options, packageName, className) {
    localStorage.setItem('jsonentity_input', input);
    localStorage.setItem('jsonentity_options', JSON.stringify(options));
    localStorage.setItem('jsonentity_package', packageName);
    localStorage.setItem('jsonentity_classname', className);
}

/**
 * Restore JSON to Spring Entity data from localStorage
 * @returns {Object} Restored data
 */
function restoreFromLocalStorage() {
    const input = localStorage.getItem('jsonentity_input');
    const options = localStorage.getItem('jsonentity_options');
    const packageName = localStorage.getItem('jsonentity_package');
    const className = localStorage.getItem('jsonentity_classname');
    
    return {
        input: input !== null ? input : null,
        options: options !== null ? JSON.parse(options) : null,
        packageName: packageName !== null ? packageName : null,
        className: className !== null ? className : null
    };
}

/**
 * Save Entity to JSON data to localStorage
 * @param {string} entityInput - Entity input value
 */
function saveEntityToJsonToLocalStorage(entityInput) {
    localStorage.setItem('jsonentity_entity_input', entityInput);
}

/**
 * Restore Entity to JSON data from localStorage
 * @returns {string|null} Restored Entity input
 */
function restoreEntityToJsonFromLocalStorage() {
    return localStorage.getItem('jsonentity_entity_input');
}

/**
 * Get options from form elements
 * @returns {Object} Options object
 */
function getOptions() {
    return {
        useData: document.getElementById('use-data').checked,
        useBuilder: document.getElementById('use-builder').checked,
        useNoargs: document.getElementById('use-noargs').checked,
        useAllargs: document.getElementById('use-allargs').checked,
        useGetter: document.getElementById('use-getter').checked,
        useSetter: document.getElementById('use-setter').checked,
        useToString: document.getElementById('use-tostring').checked,
        useEquals: document.getElementById('use-equals').checked,
        useJackson: document.getElementById('use-jackson').checked,
        usePrivate: document.getElementById('use-private').checked,
        generateNested: document.getElementById('generate-nested').checked,
        usePrimitives: document.getElementById('use-primitives').checked,
        useSnakeCaseColumns: document.getElementById('use-snake-case-columns').checked
    };
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - Kebab-case string
 * @returns {string} CamelCase string
 */
function toCamelCase(str) {
    return str.replace(/-([a-zA-Z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Apply options to form elements
 * @param {Object} options - Options object
 */
function applyOptions(options) {
    const form = document.querySelector('.settings-section');
    if (!form) return;
    
    form.querySelectorAll('input,select,textarea').forEach(el => {
        const camelName = toCamelCase(el.name);
        if (el.type === 'checkbox') {
            el.checked = !!options[camelName];
        } else if (options[camelName] !== undefined) {
            el.value = options[camelName];
        }
    });
}
