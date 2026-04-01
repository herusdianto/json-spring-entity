/**
 * Spring Entity generation logic for JSON to Spring Entity Converter
 */

/**
 * Generate Spring Entity classes from JSON object
 * @param {string} className - Main class name
 * @param {Object} jsonObj - JSON object to convert
 * @param {Object} options - Conversion options
 * @param {Map} generatedClasses - Map to store generated classes
 * @param {Map} classUsedTypes - Map to track used types per class
 * @param {Object} counters - Object to track counts
 * @param {string} parentClassName - Parent class name for inverse relations
 * @returns {string} Generated Spring Entity code
 */
function generateEntity(className, jsonObj, options, generatedClasses, classUsedTypes, counters, parentClassName = null, isNested = false) {
    counters.classCount++;
    let code = '';
    const usedTypes = new Set();

    // Class annotations - only add for non-nested classes
    if (!isNested) {
        const annotations = generateClassAnnotations(options, className);
        annotations.forEach(ann => {
            code += ann + '\n';
            counters.annotationCount++;
        });
    }

    // Class declaration
    const indent = isNested ? '    ' : '';
    code += `${indent}public class ${toPascalCase(className)} {\n\n`;

    // Fields
    const fields = [];
    if (Array.isArray(jsonObj)) {
        // If root is array, analyze first element
        if (jsonObj.length > 0 && typeof jsonObj[0] === 'object') {
            Object.keys(jsonObj[0]).forEach(key => {
                fields.push(generateField(key, jsonObj[0][key], options, className, usedTypes, generatedClasses, classUsedTypes, counters, isNested));
            });
        }
    } else if (typeof jsonObj === 'object' && jsonObj !== null) {
        Object.keys(jsonObj).forEach(key => {
            fields.push(generateField(key, jsonObj[key], options, className, usedTypes, generatedClasses, classUsedTypes, counters, isNested));
        });
    }

    // Add inverse relation field if this is a nested entity from OneToMany
    if (parentClassName) {
        const inverseField = generateInverseRelationField(parentClassName, options, usedTypes, isNested);
        fields.push(inverseField);
    }

    code += fields.join('\n\n');
    code += `\n${indent}}`;

    // Only store in generatedClasses if not nested (nested classes are part of parent)
    if (!isNested) {
        generatedClasses.set(className, code);
        classUsedTypes.set(className, usedTypes);
    }
    return code;
}

/**
 * Generate class annotations based on options
 * @param {Object} options - Conversion options
 * @param {string} className - Class name for table name
 * @returns {string[]} Array of annotation strings
 */
function generateClassAnnotations(options, className) {
    const annotations = [];

    // JPA Entity annotations
    annotations.push('@Entity');
    annotations.push(`@Table(name = "${toSnakeCase(className)}")`);

    // Lombok annotations
    if (options.useData) annotations.push('@Data');
    if (options.useBuilder) annotations.push('@Builder');
    if (options.useNoargs) annotations.push('@NoArgsConstructor');
    if (options.useAllargs) annotations.push('@AllArgsConstructor');
    if (options.useGetter) annotations.push('@Getter');
    if (options.useSetter) annotations.push('@Setter');
    if (options.useToString) annotations.push('@ToString');
    if (options.useEquals) annotations.push('@EqualsAndHashCode');

    return annotations;
}

/**
 * Generate field declaration
 * @param {string} key - Field key
 * @param {*} value - Field value
 * @param {Object} options - Conversion options
 * @param {string} parentClassName - Parent class name
 * @param {Set} usedTypes - Set to track used types
 * @param {Map} generatedClasses - Map to store generated classes
 * @param {Map} classUsedTypes - Map to track used types per class
 * @param {Object} counters - Object to track counts
 * @returns {string} Generated field code
 */
function generateField(key, value, options, parentClassName, usedTypes, generatedClasses, classUsedTypes, counters) {
    counters.fieldCount++;
    let code = '';
    const fieldName = toCamelCase(key);
    const javaType = getJavaType(key, value, options, parentClassName, usedTypes, generatedClasses, classUsedTypes, counters);
    const indent = '    ';

    // Track used types for imports
    if (javaType.startsWith('List<')) usedTypes.add('List');
    if (javaType === 'ArrayList' || javaType === 'new ArrayList<>()') usedTypes.add('ArrayList');
    if (javaType === 'LocalDate') usedTypes.add('LocalDate');
    if (javaType === 'LocalDateTime') usedTypes.add('LocalDateTime');
    if (javaType === 'Instant') usedTypes.add('Instant');

    // Check if this is a relation (object or array of objects)
    const isRelation = typeof value === 'object' && value !== null && !Array.isArray(value);
    const isOneToMany = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;

    // JPA Column annotation - only add if key is not already in snake_case and not a relation
    if (!isSnakeCase(key) && !isRelation && !isOneToMany) {
        code += indent + `@Column(name = "${toSnakeCase(key)}")\n`;
        counters.annotationCount++;
        usedTypes.add('Column');
    }

    // Add relation annotations for object relations (ManyToOne)
    if (isRelation) {
        code += indent + '@ManyToOne\n';
        code += indent + `@JoinColumn(name = "${toSnakeCase(key)}_id")\n`;
        counters.annotationCount += 2;
        usedTypes.add('ManyToOne');
        usedTypes.add('JoinColumn');
        // Generate nested entity
        const nestedClassName = toPascalCase(singularize(key));
        if (!generatedClasses.has(nestedClassName)) {
            generateEntity(nestedClassName, value, options, generatedClasses, classUsedTypes, counters, parentClassName);
        }
    }

    // Add relation annotations for array relations (OneToMany)
    if (isOneToMany) {
        const nestedClassName = toPascalCase(singularize(key));
        code += indent + `@OneToMany(mappedBy = "${toCamelCase(parentClassName)}")\n`;
        counters.annotationCount++;
        usedTypes.add('OneToMany');
        // Generate nested entity with inverse relation
        if (!generatedClasses.has(nestedClassName)) {
            generateEntity(nestedClassName, value[0], options, generatedClasses, classUsedTypes, counters, parentClassName);
        }
    }

    // Jackson annotation
    if (options.useJackson && key !== fieldName) {
        code += indent + `@JsonProperty("${key}")\n`;
        counters.annotationCount++;
        usedTypes.add('JsonProperty');
    }

    // Builder.Default logic
    let addBuilderDefault = false;
    let defaultValue = null;
    if (options.useBuilder) {
        const type = typeof value;
        if (type === 'number') {
            addBuilderDefault = true;
            if (javaType === 'double' || javaType === 'Double') {
                defaultValue = '0D';
            } else if (javaType === 'float' || javaType === 'Float') {
                defaultValue = '0F';
            } else if (javaType === 'long' || javaType === 'Long') {
                defaultValue = '0L';
            } else if (javaType === 'short' || javaType === 'Short') {
                defaultValue = '0';
            } else if (javaType === 'byte' || javaType === 'Byte') {
                defaultValue = '0';
            } else {
                defaultValue = '0';
            }
        } else if (type === 'boolean') {
            addBuilderDefault = true;
            defaultValue = 'false';
        } else if (Array.isArray(value)) {
            addBuilderDefault = true;
            defaultValue = 'new ArrayList<>()';
            usedTypes.add('ArrayList');
        }
    }

    if (addBuilderDefault) {
        code += indent + '@Builder.Default\n';
        counters.annotationCount++;
        usedTypes.add('Builder');
    }

    // Field declaration
    const visibility = options.usePrivate ? 'private' : 'public';
    code += indent + `${visibility} ${javaType} ${fieldName}`;
    if (addBuilderDefault && defaultValue !== null) {
        code += ` = ${defaultValue}`;
    }
    code += ';';

    // Add @Id and @GeneratedValue for id field with UUID generator
    if (fieldName === 'id') {
        code = indent + '@Id\n' + indent + '@GeneratedValue(generator = "uuid")\n' + indent + '@GenericGenerator(name = "uuid", strategy = "uuid2")\n' + code;
        counters.annotationCount += 3;
        usedTypes.add('Id');
        usedTypes.add('GeneratedValue');
        usedTypes.add('GenericGenerator');
    }

    return code;
}

/**
 * Get Java type for a value
 * @param {string} key - Field key
 * @param {*} value - Field value
 * @param {Object} options - Conversion options
 * @param {string} parentClassName - Parent class name
 * @param {Set} usedTypes - Set to track used types
 * @param {Map} generatedClasses - Map to store generated classes
 * @param {Map} classUsedTypes - Map to track used types per class
 * @param {Object} counters - Object to track counts
 * @returns {string} Java type string
 */
function getJavaType(key, value, options, parentClassName, usedTypes, generatedClasses, classUsedTypes, counters) {
    if (value === null) {
        return 'Object';
    }

    const type = typeof value;

    // Date/time detection patterns
    const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?([Zz]|[+-]\d{2}:?\d{2})$/;

    switch (type) {
        case 'string': {
            if (localDatePattern.test(value)) {
                usedTypes && usedTypes.add('LocalDate');
                return 'LocalDate';
            }
            if (localDateTimePattern.test(value)) {
                usedTypes && usedTypes.add('LocalDateTime');
                return 'LocalDateTime';
            }
            if (instantPattern.test(value)) {
                usedTypes && usedTypes.add('Instant');
                return 'Instant';
            }
            return 'String';
        }
        case 'number':
            if (Number.isInteger(value)) {
                if (options.usePrimitives) {
                    return value > 2147483647 || value < -2147483648 ? 'long' : 'int';
                }
                return value > 2147483647 || value < -2147483648 ? 'Long' : 'Integer';
            }
            return options.usePrimitives ? 'double' : 'Double';
        case 'boolean':
            return options.usePrimitives ? 'boolean' : 'Boolean';
        case 'object':
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    const elementType = getJavaType(key, value[0], options, parentClassName, usedTypes, generatedClasses, classUsedTypes, counters);
                    if (typeof value[0] === 'object' && !Array.isArray(value[0]) && value[0] !== null) {
                        const nestedClassName = toPascalCase(singularize(key));
                        if (!generatedClasses.has(nestedClassName)) {
                            generateEntity(nestedClassName, value[0], options, generatedClasses, classUsedTypes, counters, parentClassName);
                        }
                        return `List<${nestedClassName}>`;
                    }
                    return `List<${elementType}>`;
                }
                return 'List<Object>';
            } else {
                const nestedClassName = toPascalCase(singularize(key));
                if (!generatedClasses.has(nestedClassName)) {
                    generateEntity(nestedClassName, value, options, generatedClasses, classUsedTypes, counters, parentClassName);
                }
                return nestedClassName;
            }
        default:
            return 'Object';
    }
}

/**
 * Collect imports based on options
 * @param {Object} options - Conversion options
 * @param {Object} flags - Java time usage flags
 * @returns {string[]} Array of import statements
 */
function collectImports(options, flags) {
    const imports = [];

    // JPA imports
    imports.push('import javax.persistence.Entity;');
    imports.push('import javax.persistence.Table;');
    imports.push('import javax.persistence.Id;');
    imports.push('import javax.persistence.GeneratedValue;');
    imports.push('import javax.persistence.GenerationType;');
    imports.push('import javax.persistence.Column;');
    imports.push('import javax.persistence.ManyToOne;');
    imports.push('import javax.persistence.OneToMany;');
    imports.push('import javax.persistence.JoinColumn;');
    imports.push('import org.hibernate.annotations.GenericGenerator;');

    // Lombok imports
    if (options.useData) imports.push('import lombok.Data;');
    if (options.useBuilder) imports.push('import lombok.Builder;');
    if (options.useNoargs) imports.push('import lombok.NoArgsConstructor;');
    if (options.useAllargs) imports.push('import lombok.AllArgsConstructor;');
    if (options.useGetter) imports.push('import lombok.Getter;');
    if (options.useSetter) imports.push('import lombok.Setter;');
    if (options.useToString) imports.push('import lombok.ToString;');
    if (options.useEquals) imports.push('import lombok.EqualsAndHashCode;');

    // Jackson imports
    if (options.useJackson) {
        imports.push('import com.fasterxml.jackson.annotation.JsonProperty;');
    }

    // Java imports
    imports.push('import java.util.List;');
    imports.push('import java.util.ArrayList;');

    // Java time imports if needed
    if (flags.hasLocalDate) imports.push('import java.time.LocalDate;');
    if (flags.hasLocalDateTime) imports.push('import java.time.LocalDateTime;');
    if (flags.hasInstant) imports.push('import java.time.Instant;');

    return imports.sort();
}

/**
 * Generate inverse relation field for OneToMany relationships
 * @param {string} parentClassName - Parent class name
 * @param {Object} options - Conversion options
 * @param {Set} usedTypes - Set to track used types
 * @returns {string} Generated inverse relation field code
 */
function generateInverseRelationField(parentClassName, options, usedTypes) {
    const indent = '    ';
    let code = '';
    const fieldName = toCamelCase(parentClassName);
    
    // Add ManyToOne relation
    code += indent + '@ManyToOne\n';
    code += indent + `@JoinColumn(name = "${toSnakeCase(parentClassName)}_id")\n`;
    usedTypes.add('ManyToOne');
    usedTypes.add('JoinColumn');
    
    // Field declaration
    const visibility = options.usePrivate ? 'private' : 'public';
    code += indent + `${visibility} ${parentClassName} ${fieldName};`;
    
    return code;
}

/**
 * Get imports for used types
 * @param {Set} usedTypes - Set of used types
 * @param {Object} options - Conversion options
 * @returns {string[]} Array of import statements
 */
function getImportsForUsedTypes(usedTypes, options) {
    const imports = [];
    // JPA
    imports.push('import javax.persistence.Entity;');
    imports.push('import javax.persistence.Table;');
    if (usedTypes.has('Id')) imports.push('import javax.persistence.Id;');
    if (usedTypes.has('GeneratedValue')) imports.push('import javax.persistence.GeneratedValue;');
    if (usedTypes.has('GenerationType')) imports.push('import javax.persistence.GenerationType;');
    if (usedTypes.has('Column')) imports.push('import javax.persistence.Column;');
    if (usedTypes.has('ManyToOne')) imports.push('import javax.persistence.ManyToOne;');
    if (usedTypes.has('OneToMany')) imports.push('import javax.persistence.OneToMany;');
    if (usedTypes.has('JoinColumn')) imports.push('import javax.persistence.JoinColumn;');
    if (usedTypes.has('GenericGenerator')) imports.push('import org.hibernate.annotations.GenericGenerator;');
    // Lombok
    if (options.useData) imports.push('import lombok.Data;');
    if (usedTypes.has('Builder')) imports.push('import lombok.Builder;');
    if (options.useNoargs) imports.push('import lombok.NoArgsConstructor;');
    if (options.useAllargs) imports.push('import lombok.AllArgsConstructor;');
    if (options.useGetter) imports.push('import lombok.Getter;');
    if (options.useSetter) imports.push('import lombok.Setter;');
    if (options.useToString) imports.push('import lombok.ToString;');
    if (options.useEquals) imports.push('import lombok.EqualsAndHashCode;');
    // Jackson
    if (usedTypes.has('JsonProperty')) imports.push('import com.fasterxml.jackson.annotation.JsonProperty;');
    // Java util
    if (usedTypes.has('List')) imports.push('import java.util.List;');
    if (usedTypes.has('ArrayList')) imports.push('import java.util.ArrayList;');
    // Java time
    if (usedTypes.has('LocalDate')) imports.push('import java.time.LocalDate;');
    if (usedTypes.has('LocalDateTime')) imports.push('import java.time.LocalDateTime;');
    if (usedTypes.has('Instant')) imports.push('import java.time.Instant;');
    return imports.sort();
}
