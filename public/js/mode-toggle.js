/**
 * Mode toggle functionality for JSON to Spring Entity Converter
 */

/**
 * Initialize mode toggle between JSON to Entity and Entity to JSON
 */
function initModeToggle() {
    const modeJsonToEntity = document.getElementById('mode-json-to-entity');
    const modeEntityToJson = document.getElementById('mode-entity-to-json');
    const jsonToEntitySection = document.getElementById('json-to-entity-section');
    const entityToJsonSection = document.getElementById('entity-to-json-section');

    if (!modeJsonToEntity || !modeEntityToJson) return;

    modeJsonToEntity.addEventListener('click', () => {
        modeJsonToEntity.classList.add('active');
        modeEntityToJson.classList.remove('active');
        jsonToEntitySection.classList.remove('hidden');
        entityToJsonSection.classList.add('hidden');
        localStorage.setItem('jsonentity_mode', 'json-to-entity');
    });

    modeEntityToJson.addEventListener('click', () => {
        modeEntityToJson.classList.add('active');
        modeJsonToEntity.classList.remove('active');
        entityToJsonSection.classList.remove('hidden');
        jsonToEntitySection.classList.add('hidden');
        localStorage.setItem('jsonentity_mode', 'entity-to-json');
    });

    // Restore mode from localStorage
    const savedMode = localStorage.getItem('jsonentity_mode');
    if (savedMode === 'entity-to-json') {
        modeEntityToJson.classList.add('active');
        modeJsonToEntity.classList.remove('active');
        entityToJsonSection.classList.remove('hidden');
        jsonToEntitySection.classList.add('hidden');
    }
}
