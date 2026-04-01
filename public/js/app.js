/**
 * Main entry point for JSON to Spring Entity Converter
 */

class JsonToEntityConverter {
    constructor() {
        this.classCount = 0;
        this.fieldCount = 0;
        this.annotationCount = 0;
        this.generatedClasses = new Map();
        this.classUsedTypes = new Map();
        this._hasLocalDate = false;
        this._hasLocalDateTime = false;
        this._hasInstant = false;
        this.init();
    }

    init() {
        // Cache frequently used DOM elements
        this.jsonInput = document.getElementById('json-input');
        this.optionsForm = document.querySelector('.settings-section');
        this.outputContainer = document.getElementById('classes-container');
        
        // Restore from localStorage if available
        this.restoreFromLocalStorage();
        this.restoreEntityToJsonFromLocalStorage();
        
        // Bind event handlers
        this.bindAutoConvert();
        this.bindClearButton();
        this.bindFormatButton();
        this.bindExampleButton();
        this.bindGlobalActions();
        initThemeToggle();
        this.bindClassNameChange();
        setCurrentYear();
        this.bindEntityToJsonActions();
        initModeToggle();
    }

    restoreFromLocalStorage() {
        const data = restoreFromLocalStorage();
        if (data.input !== null) {
            this.jsonInput.value = data.input;
        }
        if (data.packageName !== null) {
            document.getElementById('package-name').value = data.packageName;
        }
        if (data.className !== null) {
            document.getElementById('class-name').value = data.className;
        }
        if (data.options !== null) {
            applyOptions(data.options);
        }
        // Trigger auto-convert if input/options exist
        if (data.input !== null || data.options !== null) {
            this.convert();
        }
    }

    restoreEntityToJsonFromLocalStorage() {
        const entityInput = restoreEntityToJsonFromLocalStorage();
        if (entityInput !== null) {
            document.getElementById('entity-input').value = entityInput;
            convertEntityToJson(entityInput);
        }
    }

    bindClearButton() {
        const clearFn = () => this.clear();
        bindClearButton(clearFn);
    }

    bindFormatButton() {
        const formatFn = () => this.formatJson();
        bindFormatButton(formatFn);
    }

    bindExampleButton() {
        const loadExampleFn = () => this.loadExample();
        bindExampleButton(loadExampleFn);
    }

    bindClassNameChange() {
        bindClassNameChange();
    }

    bindGlobalActions() {
        const getAllCodeFn = () => getAllCode();
        bindGlobalActions(getAllCodeFn);
    }

    bindAutoConvert() {
        const convertFn = () => this.convert();
        bindAutoConvert(convertFn);
    }

    bindEntityToJsonActions() {
        const convertFn = () => {
            const entityInput = document.getElementById('entity-input').value.trim();
            convertEntityToJson(entityInput);
        };
        const clearFn = () => clearEntityToJson();
        const copyFn = () => copyEntityToJson();
        const downloadFn = () => downloadEntityToJson();
        bindEntityToJsonActions(convertFn, clearFn, copyFn, downloadFn);
    }

    clear() {
        document.getElementById('json-input').value = '';
        document.getElementById('classes-container').innerHTML = '<div class="empty-state"><p>Java Entity classes will appear here...</p></div>';
        document.getElementById('stats').classList.add('hidden');
        document.getElementById('global-actions').classList.add('hidden');
        showStatus('Cleared!', 'success');
        this.saveToLocalStorage();
    }

    loadExample() {
        const exampleJson = {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "age": 30,
            "active": true,
            "salary": 75000.50,
            "address": {
                "street": "123 Main Street",
                "city": "New York",
                "state": "NY",
                "zipCode": "10001",
                "country": "USA"
            },
            "phoneNumbers": [
                {
                    "type": "home",
                    "number": "212-555-1234"
                },
                {
                    "type": "mobile",
                    "number": "646-555-5678"
                }
            ],
            "roles": ["admin", "user", "manager"],
            "metadata": {
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-03-20T14:45:00Z",
                "version": 2
            }
        };

        document.getElementById('json-input').value = JSON.stringify(exampleJson, null, 2);
        document.getElementById('class-name').value = 'User';
        document.getElementById('package-name').value = 'com.example.model';

        // Set options checked state
        document.getElementById('use-data').checked = true;
        document.getElementById('use-builder').checked = true;
        document.getElementById('use-noargs').checked = true;
        document.getElementById('use-allargs').checked = true;
        document.getElementById('use-getter').checked = false;
        document.getElementById('use-setter').checked = false;
        document.getElementById('use-tostring').checked = true;
        document.getElementById('use-equals').checked = false;
        document.getElementById('use-jackson').checked = true;
        document.getElementById('use-private').checked = true;
        document.getElementById('generate-nested').checked = true;
        document.getElementById('use-snake-case-columns').checked = true;
        document.getElementById('use-primitives').checked = false;

        showStatus('Example JSON loaded!', 'success');

        // Trigger convert after loading example
        setTimeout(() => this.convert(), 100);
        this.saveToLocalStorage();
    }

    formatJson() {
        const jsonInput = document.getElementById('json-input');
        try {
            const parsed = JSON.parse(jsonInput.value);
            jsonInput.value = JSON.stringify(parsed, null, 2);
            showStatus('JSON formatted!', 'success');
        } catch (e) {
            showStatus('Invalid JSON: ' + e.message, 'error');
        }
    }

    convert() {
        // Reset Java time usage flags before each conversion
        this._hasLocalDate = false;
        this._hasLocalDateTime = false;
        this._hasInstant = false;
        this.classUsedTypes.clear();

        const jsonInput = document.getElementById('json-input').value.trim();
        const className = document.getElementById('class-name').value.trim() || 'MyClass';
        const packageName = document.getElementById('package-name').value.trim();

        if (!jsonInput) {
            showStatus('Please enter JSON to convert', 'error');
            return;
        }

        try {
            const jsonObj = JSON.parse(jsonInput);
            this.resetCounters();
            this.generatedClasses.clear();

            const options = getOptions();

            // Generate main class and nested classes
            generateEntity(className, jsonObj, options, this.generatedClasses, this.classUsedTypes, this);

            // Build header (package + imports)
            let header = '';
            if (packageName) {
                header += `package ${packageName};\n\n`;
            }
            const imports = collectImports(options, {
                hasLocalDate: this._hasLocalDate,
                hasLocalDateTime: this._hasLocalDateTime,
                hasInstant: this._hasInstant
            });
            if (imports.length > 0) {
                header += imports.join('\n') + '\n\n';
            }

            // Render separate boxes for each class
            renderClassBoxes(header, className, this.generatedClasses, this.classUsedTypes, options, getImportsForUsedTypes);

            updateStats(this.classCount, this.fieldCount, this.annotationCount);
            document.getElementById('global-actions').classList.remove('hidden');
            showStatus('Conversion successful!', 'success');
            this.saveToLocalStorage();
        } catch (e) {
            showStatus('Error: ' + e.message, 'error');
        }
    }

    resetCounters() {
        this.classCount = 0;
        this.fieldCount = 0;
        this.annotationCount = 0;
    }

    saveToLocalStorage() {
        const input = this.jsonInput.value;
        const options = getOptions();
        const packageName = document.getElementById('package-name').value;
        const className = document.getElementById('class-name').value;
        saveToLocalStorage(input, options, packageName, className);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JsonToEntityConverter();
});
