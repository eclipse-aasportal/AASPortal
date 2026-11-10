CREATE DATABASE IF NOT EXISTS `aas-index` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `aas-index`;

CREATE TABLE endpoints (
    name VARCHAR(64) PRIMARY KEY,
    url VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL,
    version VARCHAR(8),
    headers VARCHAR(255),
    schedule VARCHAR(255)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE documents (
    uuid CHAR(21) PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    endpoint VARCHAR(64) NOT NULL,
    id VARCHAR(255) NOT NULL,
    idShort VARCHAR(128) NOT NULL,
    assetId VARCHAR(255),
    thumbnail TEXT,
    timestamp DATETIME,
    UNIQUE KEY uq_doc (id, endpoint),
    FULLTEXT KEY ft_doc (id, idShort, assetId),
    CONSTRAINT fk_doc_endpoint FOREIGN KEY (endpoint) REFERENCES endpoints (name) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE elements (
    uuid CHAR(21) NOT NULL,
    modelType VARCHAR(5) NOT NULL,
    id VARCHAR(255),
    idShort VARCHAR(128) NOT NULL,
    stringValue LONGTEXT,
    numberValue DOUBLE,
    bigintValue BIGINT,
    dateValue DATETIME,
    booleanValue BOOLEAN,
    FULLTEXT KEY ft_element (id, idShort, stringValue),
    CONSTRAINT fk_elem_doc FOREIGN KEY (uuid) REFERENCES documents (uuid) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE submodelConceptDescriptions (
    endpoint VARCHAR(64) NOT NULL,
    id VARCHAR(255) NOT NULL,
    conceptDescriptionIds TEXT,
    PRIMARY KEY (id, endpoint),
    CONSTRAINT fk_scd_endpoint FOREIGN KEY (endpoint) REFERENCES endpoints (name) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;