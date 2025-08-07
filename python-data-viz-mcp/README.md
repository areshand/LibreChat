# Python Data Visualization MCP Server

An MCP (Model Context Protocol) server that enables safe execution of Python code for data analysis and visualization using NumPy, Pandas, and Matplotlib.

## Features

- **Safe Code Execution**: AST-based validation to prevent dangerous operations
- **Data Analysis**: Support for NumPy and Pandas operations
- **Visualization**: Matplotlib plotting with base64 encoded PNG output
- **Security**: Restricted execution environment with allowlisted functions
- **Error Handling**: Comprehensive error reporting and validation

## Installation

1. Install using uv (recommended):
```bash
uv add ".[dev]"
```

2. Or using pip:
```bash
pip install -e ".[dev]"
```

## Usage

### Running the Server

```bash
uv run python -m python_data_viz_mcp.server
```

### Available Tools

1. **execute_python(code: str)**: Execute Python code safely
   - Returns execution results, output, and plots (if any)
   - Validates code for security before execution

2. **list_available_functions()**: Get list of available functions by category
   - Shows NumPy, Pandas, Matplotlib, and builtin functions

3. **create_sample_data()**: Generate sample data code for testing
   - Returns Python code snippets for creating test datasets

### Security Features

The server implements multiple layers of security:

- **AST Validation**: Parses and validates code structure
- **Function Allowlisting**: Only permits safe functions and modules
- **Restricted Environment**: Limits available builtins and modules
- **No File System Access**: Prevents file operations
- **No Network Access**: Blocks network-related operations

### Blocked Operations

- File I/O operations (`open`, `file`)
- System operations (`exec`, `eval`, `compile`)
- Import of unauthorized modules
- Access to dangerous attributes (`__class__`, etc.)
- Network operations
- Process spawning

### Example Usage

```python
# Simple data analysis
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Create sample data
data = np.random.randn(100)
df = pd.DataFrame({'values': data})

# Basic statistics
print(f"Mean: {df['values'].mean():.2f}")
print(f"Std: {df['values'].std():.2f}")

# Create visualization
plt.figure(figsize=(8, 6))
plt.hist(data, bins=20, alpha=0.7)
plt.title('Random Data Distribution')
plt.xlabel('Value')
plt.ylabel('Frequency')
```

## Development

Run tests:
```bash
pytest
```

Format code:
```bash
black src/
```

Type checking:
```bash
mypy src/
```

## Configuration

The server can be configured by modifying the allowlisted modules and functions in `server.py`:

- `ALLOWED_MODULES`: Permitted import modules
- `DANGEROUS_FUNCTIONS`: Functions to block
- `safe_globals`: Available functions in execution environment