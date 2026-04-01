/**
 * Spring Entity to JSON conversion logic
 */

/**
 * Convert Spring Entity code to JSON
 * @param {string} entityInput - Spring Entity code input
 * @returns {Object} Parsed JSON object
 */
function convertEntityToJson(entityInput) {
    if (!entityInput) {
        // showStatus('Please enter Spring Entity code to convert', 'error');
        return null;
    }

    try {
        const jsonObj = parseEntityToJson(entityInput);
        const jsonOutput = JSON.stringify(jsonObj, null, 2);
        document.getElementById('json-output').value = jsonOutput;
        showStatus('Entity to JSON conversion successful!', 'success');
        saveEntityToJsonToLocalStorage(entityInput);
        return jsonObj;
    } catch (e) {
        showStatus('Error parsing Entity: ' + e.message, 'error');
        return null;
    }
}

/**
 * Parse Spring Entity code to JSON object
 * @param {string} entityCode - Spring Entity code string
 * @returns {Object} Parsed JSON object
 */
function parseEntityToJson(entityCode) {
    const result = {};
    
    // Remove comments
    entityCode = entityCode.replace(/\/\/[\s\S]*?\n/g, '');
    entityCode = entityCode.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove JPA and Lombok annotations
    entityCode = entityCode.replace(/@(Entity|Table|Id|GeneratedValue|GenerationType|Column|Data|Builder|Builder\.Default|NoArgsConstructor|AllArgsConstructor|Getter|Setter|ToString|EqualsAndHashCode|JsonProperty)\s*(\([^)]*\))?\s*/g, '');
    
    // Split input into separate entity classes
    const entityClasses = [];
    const classPattern = /(?:public|private|protected)?\s*(?:static)?\s*class\s+(\w+)\s*(?:extends\s+\w+)?\s*(?:implements\s+[^{]+)?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let classMatch;
    
    while ((classMatch = classPattern.exec(entityCode)) !== null) {
        const className = classMatch[1];
        const classBody = classMatch[2];
        entityClasses.push({ name: className, body: classBody });
    }
    
    // If multiple entity classes found, parse only the first one
    // If only one class found, parse it
    if (entityClasses.length > 0) {
        const mainClass = entityClasses[0];
        const nestedClasses = {};
        
        // Parse other classes as nested classes
        for (let i = 1; i < entityClasses.length; i++) {
            const entityClass = entityClasses[i];
            nestedClasses[entityClass.name] = parseClassBody(entityClass.body);
        }
        
        // Parse main class fields
        // First, remove annotations and default value initializations
        let cleanedBody = mainClass.body;
        // Remove annotations (lines starting with @)
        cleanedBody = cleanedBody.replace(/@[^\n]*\n/g, '');
        // Remove default value initializations (= ...)
        cleanedBody = cleanedBody.replace(/=\s*[^;]+;/g, ';');
        
        const fieldPattern = /(?:private|public|protected)?\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/g;
        let match;
        
        while ((match = fieldPattern.exec(cleanedBody)) !== null) {
            const type = match[1];
            const fieldName = match[2];
            result[fieldName] = generateSampleValue(type, fieldName, nestedClasses);
        }
    }
    
    return result;
}

/**
 * Parse class body to extract fields
 * @param {string} classBody - Class body content
 * @returns {Object} Parsed fields object
 */
function parseClassBody(classBody) {
    const result = {};
    // First, remove annotations and default value initializations
    let cleanedBody = classBody;
    // Remove annotations (lines starting with @)
    cleanedBody = cleanedBody.replace(/@[^\n]*\n/g, '');
    // Remove default value initializations (= ...)
    cleanedBody = cleanedBody.replace(/=\s*[^;]+;/g, ';');
    
    const fieldPattern = /(?:private|public|protected)?\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/g;
    let match;
    
    while ((match = fieldPattern.exec(cleanedBody)) !== null) {
        const type = match[1];
        const fieldName = match[2];
        result[fieldName] = generateSampleValue(type, fieldName, {});
    }
    
    return result;
}

/**
 * Generate sample value based on Java type
 * @param {string} type - Java type
 * @param {string} fieldName - Field name
 * @param {Object} nestedClasses - Nested classes definitions
 * @returns {*} Sample value
 */
function generateSampleValue(type, fieldName, nestedClasses = {}) {
    // Handle generic types like List<String>, Map<String, Object>
    const genericMatch = type.match(/^(\w+)<(.+)>$/);
    if (genericMatch) {
        const containerType = genericMatch[1];
        const innerType = genericMatch[2];
        
        if (containerType === 'List' || containerType === 'ArrayList') {
            return [generateSampleValue(innerType.trim(), fieldName, nestedClasses)];
        }
        if (containerType === 'Map') {
            return { "key": generateSampleValue(innerType.split(',')[1]?.trim() || 'Object', fieldName, nestedClasses) };
        }
        if (containerType === 'Set') {
            return [generateSampleValue(innerType.trim(), fieldName, nestedClasses)];
        }
    }
    
    // Handle array types
    if (type.endsWith('[]')) {
        const elementType = type.slice(0, -2);
        return [generateSampleValue(elementType, fieldName, nestedClasses)];
    }
    
    // Handle primitive and common types
    const lowerFieldName = fieldName.toLowerCase();
    
    switch (type) {
        case 'String':
            if (lowerFieldName.includes('email')) return 'user@example.com';
            if (lowerFieldName.includes('name')) return 'John Doe';
            if (lowerFieldName.includes('phone')) return '+1-234-567-8900';
            if (lowerFieldName.includes('address')) return '123 Main Street';
            if (lowerFieldName.includes('city')) return 'New York';
            if (lowerFieldName.includes('country')) return 'USA';
            if (lowerFieldName.includes('url') || lowerFieldName.includes('link')) return 'https://example.com';
            if (lowerFieldName.includes('date')) return '2024-01-15';
            if (lowerFieldName.includes('time')) return '10:30:00';
            return 'sample string';
        case 'int':
        case 'Integer':
            if (lowerFieldName.includes('age')) return 25;
            if (lowerFieldName.includes('count') || lowerFieldName.includes('quantity')) return 10;
            if (lowerFieldName.includes('year')) return 2024;
            if (lowerFieldName.includes('month')) return 1;
            if (lowerFieldName.includes('day')) return 15;
            return 1;
        case 'long':
        case 'Long':
            if (lowerFieldName.includes('uuid')) return '550e8400-e29b-41d4-a716-446655440000';
            if (lowerFieldName.includes('timestamp')) return 1705312200000;
            return 1000000;
        case 'double':
        case 'Double':
            if (lowerFieldName.includes('price') || lowerFieldName.includes('amount')) return 99.99;
            if (lowerFieldName.includes('rate') || lowerFieldName.includes('percentage')) return 0.15;
            return 1.5;
        case 'float':
        case 'Float':
            return 1.5;
        case 'boolean':
        case 'Boolean':
            if (lowerFieldName.includes('active') || lowerFieldName.includes('enabled')) return true;
            if (lowerFieldName.includes('deleted') || lowerFieldName.includes('disabled')) return false;
            return true;
        case 'short':
        case 'Short':
            return 1;
        case 'byte':
        case 'Byte':
            return 1;
        case 'char':
        case 'Character':
            return 'A';
        case 'BigDecimal':
            return 99.99;
        case 'BigInteger':
            return 1000000;
        case 'LocalDate':
            return '2024-01-15';
        case 'LocalDateTime':
            return '2024-01-15T10:30:00';
        case 'Instant':
            return '2024-01-15T10:30:00Z';
        case 'Date':
            return '2024-01-15T10:30:00Z';
        case 'UUID':
            return '550e8400-e29b-41d4-a716-446655440000';
        case 'Object':
            return {};
        default:
            // Check if type matches a nested class
            if (nestedClasses[type]) {
                return nestedClasses[type];
            }
            return {};
    }
}

/**
 * Clear Entity to JSON section
 */
function clearEntityToJson() {
    document.getElementById('entity-input').value = '';
    document.getElementById('json-output').value = '';
    showStatus('Entity to JSON cleared!', 'success');
    saveEntityToJsonToLocalStorage('');
}

/**
 * Copy JSON output to clipboard
 */
function copyEntityToJson() {
    const jsonOutput = document.getElementById('json-output').value;
    if (jsonOutput) {
        navigator.clipboard.writeText(jsonOutput)
            .then(() => showStatus('JSON copied to clipboard!', 'success'))
            .catch(() => showStatus('Failed to copy', 'error'));
    } else {
        showStatus('Nothing to copy', 'error');
    }
}

/**
 * Download JSON output as file
 */
function downloadEntityToJson() {
    const jsonOutput = document.getElementById('json-output').value;
    if (jsonOutput) {
        const blob = new Blob([jsonOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showStatus('JSON downloaded!', 'success');
    } else {
        showStatus('Nothing to download', 'error');
    }
}
