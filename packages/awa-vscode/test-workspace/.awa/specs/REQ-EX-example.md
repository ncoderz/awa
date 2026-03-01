# Requirements Specification

## Introduction

Example feature requirements for testing the awa VS Code extension and LSP server.

## Requirements

### EX-1: Parse input

AS A developer, I WANT the system to parse input data, SO THAT I get a structured format.

ACCEPTANCE CRITERIA

- EX-1_AC-1 [event]: WHEN the system receives valid input THEN it SHALL return a structured object
- EX-1_AC-2 [event]: WHEN the system receives invalid input THEN it SHALL throw an error

### EX-2: Format output

AS A user, I WANT formatted output, SO THAT I can read the data easily.

ACCEPTANCE CRITERIA

- EX-2_AC-1 [event]: WHEN given a data object THEN the system SHALL return a human-readable string
- EX-2_AC-2 [conditional]: IF the object is empty THEN the system SHALL return an empty string

### EX-3: Validate schema

AS A developer, I WANT the system to validate input against a schema, SO THAT invalid data is rejected early.

ACCEPTANCE CRITERIA

- EX-3_AC-1 [event]: WHEN input matches the schema THEN the system SHALL return true
