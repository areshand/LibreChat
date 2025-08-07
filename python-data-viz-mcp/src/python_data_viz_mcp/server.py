"""MCP server for safe Python data analysis and visualization."""

import ast
import base64
import collections
import io
import os
import sys
import tempfile
import traceback
from typing import Any, Dict, List, Optional, Tuple

import matplotlib
matplotlib.use('Agg')  # Set backend before importing pyplot
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from mcp.server.fastmcp import FastMCP
from RestrictedPython import compile_restricted
import warnings

# Suppress matplotlib warnings
warnings.filterwarnings('ignore', category=UserWarning, module='matplotlib')
plt.style.use('default')

mcp = FastMCP("Python Data Visualization Server")


class SafeCodeValidator:
    """Validates Python code for safe execution."""

    ALLOWED_MODULES = {
        # Core data analysis
        "numpy",
        "np",
        "pandas",
        "pd",
        "matplotlib",
        "matplotlib.pyplot",
        "plt",
        "seaborn",
        "sns",
        "scipy",
        "sklearn",
        "plotly",
        
        # Built-in Python modules
        "math",
        "statistics",
        "random",
        "datetime",
        "json",
        "collections",
        "itertools",
        "functools",
        "operator",
        "re",
        "string",
        "decimal",
        "fractions",
        "warnings",
        "copy",
        "io",
        "os",
        "sys",
        "time",
        "calendar",
        "typing",
        "enum",
        "dataclasses",
        "pathlib",
        "tempfile",
        "array",
        "bisect",
        "heapq",
        "base64",
        "binascii",
        "struct",
        "hashlib",
        "uuid",
        "logging",
        
        # Data processing
        "csv",
        "pickle",
        "gzip",
        "zipfile",
        "tarfile",
        "configparser",
        
        # Text processing
        "textwrap",
        "unicodedata",
        "codecs",
        
        # File operations
        "glob",
        "fnmatch",
        "shutil",
        "filecmp",
        
        # Network (limited safe modules)
        "urllib",
        "http",
        "email",
        "mimetypes",
        "html",
        "xml",
    }

    DANGEROUS_FUNCTIONS = {
        "exec",
        "eval",
        "compile",
        "__import__",
        "open",
        "file",
        "input",
        "raw_input",
        "reload",
        "vars",
        "locals",
        "globals",
        "dir",
        "hasattr",
        "getattr",
        "setattr",
        "delattr",
        "isinstance",
        "issubclass",
        "callable",
        "type",
        "__builtins__",
    }

    DANGEROUS_NODES = {
        ast.Import,
        ast.ImportFrom,
        ast.FunctionDef,
        ast.AsyncFunctionDef,
        ast.ClassDef,
        ast.With,
        ast.AsyncWith,
        ast.Try,
        ast.ExceptHandler,
        ast.Raise,
        ast.Assert,
        ast.Delete,
        ast.Global,
        ast.Nonlocal,
    }
    
    @classmethod
    def validate_code(cls, code: str) -> Tuple[bool, Optional[str]]:
        """Validate if code is safe to execute."""
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, f"Syntax error: {e}"
        
        validator = cls()
        try:
            validator.visit(tree)
            return True, None
        except ValueError as e:
            return False, str(e)
    
    def visit(self, node: ast.AST) -> None:
        """Visit AST nodes and check for dangerous patterns."""
        if type(node) in self.DANGEROUS_NODES:
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                self._check_import(node)
            else:
                raise ValueError(f"Dangerous node type: {type(node).__name__}")
        
        if isinstance(node, ast.Name):
            self._check_name(node)
        elif isinstance(node, ast.Call):
            self._check_call(node)
        elif isinstance(node, ast.Attribute):
            self._check_attribute(node)
        
        for child in ast.iter_child_nodes(node):
            self.visit(child)
    
    def _check_import(self, node) -> None:
        """Check if import is allowed."""
        if isinstance(node, ast.Import):
            for alias in node.names:
                if not self._is_module_allowed(alias.name):
                    raise ValueError(f"Import not allowed: {alias.name}")
        elif isinstance(node, ast.ImportFrom):
            if node.module and not self._is_module_allowed(node.module):
                raise ValueError(f"Import not allowed: {node.module}")
    
    def _is_module_allowed(self, module_name: str) -> bool:
        """Check if a module name is allowed, including submodules."""
        if module_name in self.ALLOWED_MODULES:
            return True

        # Allow matplotlib submodules
        if module_name.startswith("matplotlib."):
            return True

        # Allow numpy submodules
        if module_name.startswith("numpy."):
            return True

        # Allow pandas submodules
        if module_name.startswith("pandas."):
            return True

        return False
    
    def _check_name(self, node: ast.Name) -> None:
        """Check if name access is dangerous."""
        if node.id in self.DANGEROUS_FUNCTIONS:
            raise ValueError(f"Dangerous function: {node.id}")
    
    def _check_call(self, node: ast.Call) -> None:
        """Check if function call is dangerous."""
        if isinstance(node.func, ast.Name):
            if node.func.id in self.DANGEROUS_FUNCTIONS:
                raise ValueError(f"Dangerous function call: {node.func.id}")
    
    def _check_attribute(self, node: ast.Attribute) -> None:
        """Check if attribute access is dangerous."""
        dangerous_attrs = {'__class__', '__bases__', '__subclasses__', '__mro__'}
        if node.attr in dangerous_attrs:
            raise ValueError(f"Dangerous attribute access: {node.attr}")


class SafeExecutor:
    """Executes Python code safely with restricted environment."""
    
    def __init__(self):
        self.safe_globals = {
            '__builtins__': {
                'len': len, 'range': range, 'enumerate': enumerate,
                'zip': zip, 'map': map, 'filter': filter, 'sum': sum,
                'min': min, 'max': max, 'abs': abs, 'round': round,
                'sorted': sorted, 'reversed': reversed, 'all': all, 'any': any,
                'str': str, 'int': int, 'float': float, 'bool': bool,
                'list': list, 'dict': dict, 'tuple': tuple, 'set': set,
                'print': print, 'ValueError': ValueError, 'TypeError': TypeError,
                'IndexError': IndexError, 'KeyError': KeyError,
                '__import__': __import__,  # Add __import__ for import statements
            },
            'np': np,
            'numpy': np,
            'pd': pd,
            'pandas': pd,
            'plt': plt,
            'matplotlib': matplotlib,
            'collections': collections,
        }
    
    def execute(self, code: str) -> Dict[str, Any]:
        """Execute code safely and return results."""
        is_safe, error = SafeCodeValidator.validate_code(code)
        if not is_safe:
            return {'success': False, 'error': f'Code validation failed: {error}'}
        
        try:
            local_vars = {}
            
            old_stdout = sys.stdout
            stdout_buffer = io.StringIO()
            sys.stdout = stdout_buffer
            
            fig_buffer = io.BytesIO()
            plt.ioff()
            
            try:
                exec(code, self.safe_globals, local_vars)
                
                output = stdout_buffer.getvalue()
                
                plot_data = None
                if plt.get_fignums():
                    plt.savefig(fig_buffer, format='png', bbox_inches='tight', dpi=150)
                    fig_buffer.seek(0)
                    plot_data = base64.b64encode(fig_buffer.read()).decode('utf-8')
                    plt.close('all')
                
                return {
                    'success': True,
                    'output': output,
                    'plot': plot_data,
                    'variables': {k: str(v) for k, v in local_vars.items() 
                                if not k.startswith('_')}
                }
            
            finally:
                sys.stdout = old_stdout
                plt.close('all')
                
        except Exception as e:
            return {
                'success': False,
                'error': f'{type(e).__name__}: {str(e)}',
                'traceback': traceback.format_exc()
            }


executor = SafeExecutor()


@mcp.tool()
def execute_python(code: str) -> Dict[str, Any]:
    """
    Execute Python code safely with numpy, pandas, and matplotlib.
    
    Args:
        code: Python code to execute (string)
        
    Returns:
        Dictionary containing:
        - success: Boolean indicating if execution succeeded
        - output: Printed output from the code
        - plot: Base64 encoded PNG plot (if matplotlib was used)
        - variables: Dictionary of variables created
        - error: Error message (if success is False)
    """
    return executor.execute(code)


@mcp.tool()
def list_available_functions() -> Dict[str, List[str]]:
    """
    List available functions and modules for data analysis.
    
    Returns:
        Dictionary with available functions organized by category
    """
    return {
        'numpy': [
            'np.array()', 'np.arange()', 'np.linspace()', 'np.zeros()', 'np.ones()',
            'np.mean()', 'np.std()', 'np.sum()', 'np.min()', 'np.max()',
            'np.sin()', 'np.cos()', 'np.exp()', 'np.log()', 'np.sqrt()'
        ],
        'pandas': [
            'pd.DataFrame()', 'pd.Series()', 'pd.read_csv()', 'pd.concat()',
            '.head()', '.tail()', '.describe()', '.info()', '.groupby()',
            '.sort_values()', '.drop()', '.fillna()', '.isnull()'
        ],
        'matplotlib': [
            'plt.plot()', 'plt.scatter()', 'plt.bar()', 'plt.hist()',
            'plt.xlabel()', 'plt.ylabel()', 'plt.title()', 'plt.legend()',
            'plt.figure()', 'plt.subplot()', 'plt.show()', 'plt.savefig()'
        ],
        'collections': [
            'collections.Counter()', 'collections.defaultdict()', 'collections.deque()',
            'collections.OrderedDict()', 'collections.namedtuple()', 'collections.ChainMap()'
        ],
        'builtin': [
            'print()', 'len()', 'sum()', 'min()', 'max()', 'sorted()',
            'range()', 'enumerate()', 'zip()', 'map()', 'filter()'
        ]
    }


@mcp.tool()
def create_sample_data() -> Dict[str, Any]:
    """
    Generate sample data for testing visualizations.
    
    Returns:
        Dictionary with formatted Python code and metadata
    """
    code = """# Sample datasets you can use:

# 1. Simple numeric data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# 2. Random data for scatter plots
data = np.random.randn(100, 2)

# 3. Sample DataFrame
df = pd.DataFrame({
    'x': np.random.randn(50),
    'y': np.random.randn(50),
    'category': np.random.choice(['A', 'B', 'C'], 50)
})

# 4. Time series data
dates = pd.date_range('2023-01-01', periods=30)
ts_data = pd.DataFrame({
    'date': dates,
    'value': np.cumsum(np.random.randn(30))
})

# Example plots:
# plt.plot(x, y)
# plt.scatter(data[:, 0], data[:, 1])
# df.plot.scatter(x='x', y='y', c='category', colormap='viridis')"""
    
    return {
        'success': True,
        'code': code,
        'description': 'Sample Python code for creating test datasets and visualizations',
        'examples': [
            'Simple numeric data with sine wave',
            'Random scatter plot data',
            'Pandas DataFrame with categories',
            'Time series data'
        ]
    }


if __name__ == "__main__":
    mcp.run()
