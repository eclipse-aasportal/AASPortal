USE `aas-index`;

CREATE TABLE endpoints (
    name VARCHAR(32) PRIMARY KEY,
    url VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL,
    version VARCHAR(8),
    headers VARCHAR(255),
    schedule VARCHAR(255)
);

CREATE TABLE documents (
    uuid CHAR(21) PRIMARY KEY,
    address VARCHAR(255), 
    endpoint VARCHAR(32), 
    id VARCHAR(255), 
    idShort VARCHAR(100), 
    assetId VARCHAR(255),
    thumbnail TEXT, 
    timestamp LONG,
    UNIQUE (id, endpoint)
);

CREATE TABLE elements (
    uuid CHAR(21) NOT NULL,
    modelType VARCHAR(5) NOT NULL,
    id VARCHAR(255),
    idShort VARCHAR(100) NOT NULL,
    stringValue VARCHAR(512),
    numberValue DOUBLE,
    bigintValue LONG,
    dateValue DATETIME,
    booleanValue BOOLEAN
);

CREATE TABLE submodelConceptDescriptions (
    endpoint VARCHAR(32), 
    id VARCHAR(255),
    conceptDescriptionIds TEXT,
    UNIQUE (id, endpoint)
);
