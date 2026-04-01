# JSON to Spring Entity Converter

A client-side web tool for converting JSON to Spring Entity classes with JPA annotations and Lombok support.

**100% Client-side - No data sent to server!**

## Features

### JSON to Spring Entity Conversion
- ✅ Convert JSON to Spring Entity classes
- ✅ Generate JPA annotations (@Entity, @Table, @Id, @GeneratedValue, @Column)
- ✅ Generate Lombok annotations (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor, etc.)
- ✅ Jackson annotations support (@JsonProperty)
- ✅ Nested object support with automatic class generation
- ✅ Array/List type detection
- ✅ Primitive type option (int, long, double, boolean)
- ✅ Custom package name
- ✅ Custom root class name
- ✅ Format JSON input
- ✅ Copy to clipboard
- ✅ Download as .java file
- ✅ Dark/Light mode toggle
- ✅ Responsive design
- ✅ Statistics display (classes, fields, annotations count)

### Spring Entity to JSON Conversion
- ✅ Convert Spring Entity classes to JSON
- ✅ Support for primitive types (int, long, double, boolean, etc.)
- ✅ Support for wrapper types (Integer, Long, Double, Boolean, etc.)
- ✅ Support for String type
- ✅ Support for collection types (List, ArrayList, Set, Map)
- ✅ Support for array types
- ✅ Support for Java 8 date/time types (LocalDate, LocalDateTime, Instant)
- ✅ Support for BigDecimal and BigInteger
- ✅ Support for UUID type
- ✅ Smart sample value generation based on field names
- ✅ Copy JSON to clipboard
- ✅ Download as .json file
- ✅ Local storage persistence

## JPA Annotations Supported

| Annotation | Description |
|------------|-------------|
| `@Entity` | Marks class as a JPA entity |
| `@Table` | Specifies the database table name |
| `@Id` | Marks field as primary key |
| `@GeneratedValue` | Specifies primary key generation strategy |
| `@Column` | Specifies column mapping |

## Lombok Annotations Supported

| Annotation | Description |
|------------|-------------|
| `@Data` | Generates getters, setters, toString, equals, hashCode |
| `@Builder` | Generates builder pattern |
| `@NoArgsConstructor` | Generates no-args constructor |
| `@AllArgsConstructor` | Generates all-args constructor |
| `@Getter` | Generates getters only |
| `@Setter` | Generates setters only |
| `@ToString` | Generates toString method |
| `@EqualsAndHashCode` | Generates equals and hashCode methods |

## Additional Options

| Option | Description |
|--------|-------------|
| Jackson Annotations | Adds `@JsonProperty` for field name mapping |
| Private Fields | Uses private field visibility |
| Generate Nested Classes | Creates separate classes for nested objects |
| Use Primitive Types | Uses `int`, `long`, `double`, `boolean` instead of wrapper classes |

## Usage

### Option 1: Open directly in browser

Simply open `public/index.html` in your web browser.

### Option 2: Use a local server

```bash
# Using Python
cd public
python -m http.server 8000

# Using Node.js (http-server)
npx http-server public

# Using PHP
cd public
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Example

### JSON to Spring Entity

#### Input JSON
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "active": true,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001"
  },
  "roles": ["admin", "user"]
}
```

#### Output Spring Entity (with @Data and Jackson annotations)
```java
package com.example.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "user")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    private String email;

    private Boolean active;

    private Address address;

    private List<String> roles;
}

@Entity
@Table(name = "address")
@Data
public class Address {

    private String street;

    private String city;

    @Column(name = "zip_code")
    @JsonProperty("zipCode")
    private String zipCode;
}
```

### Spring Entity to JSON

#### Input Spring Entity
```java
@Entity
@Table(name = "user")
public class User {
    private String name;
    private String email;
    private Integer age;
    private Boolean active;
    private List<String> roles;
}
```

#### Output JSON
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "age": 25,
  "active": true,
  "roles": ["sample string"]
}
```

## Technologies Used

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript (ES6+)
- No external dependencies

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## Demo

[https://herusdianto.github.io/json-spring-entity/](https://herusdianto.github.io/json-spring-entity/)
