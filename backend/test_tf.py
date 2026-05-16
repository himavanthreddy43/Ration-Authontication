import sys
from unittest.mock import MagicMock
sys.modules['tensorflow.lite.python.metrics._pywrap_tensorflow_lite_metrics_wrapper'] = MagicMock()

try:
    import tensorflow
    print("TensorFlow imported successfully!")
except Exception as e:
    print(f"Error: {e}")
